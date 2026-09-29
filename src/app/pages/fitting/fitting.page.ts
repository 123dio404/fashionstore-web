import { CommonModule } from '@angular/common';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DrawingUtils, NormalizedLandmark, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { firstValueFrom } from 'rxjs';

import { FigmaColor, FigmaProduct, arKindFor, arModelFor } from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';
import { ExperienceService } from '../../core/services/experience.service';
import {
  FittingAppearance,
  Garment3DService,
  GarmentType,
  ModelKind,
} from '../../core/services/garment3d.service';
import { FittingPose, PoseLandmarkerService } from '../../core/services/pose-landmarker.service';

type GarmentChoice = 'auto' | GarmentType;

const LANDMARK = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftShoulder: 11,
  rightShoulder: 12,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
} as const;

const SIZE_FIT: Record<string, number> = {
  XS: 0.86,
  S: 0.94,
  M: 1.0,
  L: 1.08,
  XL: 1.16,
};

/** Inferencia de tipo de prenda a partir del nombre del producto. */
const INFER: Array<[RegExp, GarmentType]> = [
  [/vestido|midi|jumpsuit|enterizo/i, 'dress'],
  [/jeans|pantal|short|bermuda|falda|legging/i, 'bottom'],
  [/blazer|chaqueta|jacket|camis|blusa|top|pulover|sweater|sueter|cardigan|polera/i, 'top'],
];

/**
 * CU17 — Vestidor Virtual AR (probador web 3D).
 * Prenda 3D (three.js) sobre la cámara: la malla se deforma a la pose
 * (hombros → caderas) con BlazePose en tiempo real y rota con el torso.
 */
@Component({
  selector: 'app-fitting-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './fitting.page.html',
  styleUrl: './fitting.page.scss',
})
export class FittingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CatalogStore);
  private readonly pose = inject(PoseLandmarkerService);
  private readonly garment = inject(Garment3DService);
  private readonly experience = inject(ExperienceService);

  readonly MIN_FIT = 0.78;
  readonly MAX_FIT = 1.25;

  readonly mirror = viewChild<ElementRef<HTMLDivElement>>('mirror');
  readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  readonly overlay = viewChild<ElementRef<HTMLCanvasElement>>('overlay');

  readonly product = signal<FigmaProduct | undefined>(undefined);
  readonly started = signal(false);
  readonly error = signal<string | null>(null);
  readonly phase = signal<'model' | 'camera' | 'ready'>('model');
  readonly cameraOn = signal(false);
  readonly bodyDetected = signal(false);
  readonly type = signal<GarmentChoice>('auto');
  readonly size = signal('M');
  readonly fit = signal(1);
  readonly manualOffsetX = signal(0);
  readonly manualOffsetY = signal(0);
  readonly colorIdx = signal(0);
  readonly notice = signal<string | null>(null);
  /** Muestra los 33 landmarks + esqueleto de pose para el probador interactivo. */
  readonly showSkeleton = signal(true);
  /** Diagnóstico en pantalla para saber en qué etapa se corta el vestidor. */
  readonly dbg = signal('Iniciando…');
  readonly dbgPose = signal<'cargando' | 'ok' | 'fallo'>('cargando');
  readonly dbgGl = signal<'cargando' | 'ok' | 'fallo'>('cargando');

  readonly garmentOptions = [
    { value: 'auto' as GarmentChoice, label: 'Auto' },
    { value: 'top' as GarmentChoice, label: 'Superior' },
    { value: 'dress' as GarmentChoice, label: 'Vestido' },
    { value: 'bottom' as GarmentChoice, label: 'Pantalón' },
  ];

  private stream: MediaStream | null = null;
  private raf = 0;
  private lastVideoTime = -1;
  private lastW = 0;
  private lastH = 0;
  private smooth: FittingPose | null = null;
  private skeletonUtils: DrawingUtils | null = null;
  private savedSession = false;
  private glReady = false;

  readonly sizes = computed(() => this.product()?.sizes ?? ['XS', 'S', 'M', 'L', 'XL']);
  readonly colors = computed(() => {
    const colors = this.product()?.colors ?? [];
    return colors.length ? colors : ([{ name: 'Negro', hex: '#111827' }] as FigmaColor[]);
  });

  /** CU17 — mismo modelo que muestra el detalle del catálogo (`arModelFor`). */
  readonly modelUrl = computed(() => arModelFor(this.product()));
  readonly modelKind = computed<ModelKind>(() => arKindFor(this.modelUrl()));

  readonly active = computed(() => this.phase() === 'ready');

  readonly statusLabel = computed(() => {
    if (!this.started()) return 'Apagado';
    if (this.error()) return 'Error';
    if (this.phase() === 'model') return 'Cargando pose';
    if (this.phase() === 'camera') return 'Cámara';
    return this.cameraOn() && this.bodyDetected() ? 'En vivo' : 'Detectando';
  });

  readonly autoType = computed<GarmentType | null>(() => {
    const name = this.product()?.name ?? '';
    for (const [re, type] of INFER) if (re.test(name)) return type;
    return null;
  });

  readonly fitLabel = computed(() => `${Math.round(this.fit() * 100)}%`);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('productId'));
      this.started.set(false);
      this.bodyDetected.set(false);
      this.notice.set(null);
      this.product.set(this.store.byId(id));
      this.syncModel();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.stopCamera();
    this.garment.dispose();
    this.glReady = false;
  }

  /* ----------------------------------------------------------- Ciclo ------ */

  start(): void {
    this.error.set(null);
    this.started.set(true);
    this.phase.set('camera');

    // Iniciar cámara de inmediato para aprovechar el gesto del usuario y pedir permisos ya
    const camPromise = this.openCamera();
    const posePromise = this.pose.load();

    Promise.all([camPromise, posePromise])
      .then(() => {
        this.initGl();
        this.phase.set('ready');
        this.savedSession = false;
        this.beginLoop();
      })
      .catch((err: unknown) => {
        console.error('[Probador] Error al iniciar vestidor:', err);
        this.error.set(msg(err));
        this.stopCamera();
      });
  }

  toggleCamera(): void {
    if (this.cameraOn()) {
      this.stopCamera();
    } else {
      this.openCamera()
        .then(() => this.beginLoop())
        .catch(() => this.error.set(msg()));
    }
  }

  private initGl(): void {
    if (this.glReady) return;
    const host = this.mirror()?.nativeElement;
    if (!host) return;
    const hasCustomModel = !!this.modelUrl();
    this.garment.create(host, 640, 720, hasCustomModel);
    this.glReady = true;
    this.syncModel();
  }

  /**
   * Sincroniza el probador con el producto del catálogo: si el producto tiene un
   * modelo 3D real (zapato/gafas/blazer) se carga ese objeto; si es ropa genérica, se muestra la
   * malla que se ajusta al cuerpo. Fallback: si no llega el modelo, queda la malla.
   */
  private syncModel(): void {
    if (!this.glReady) return;
    const url = this.modelUrl();
    const kind = this.modelKind();
    if (url) {
      console.log(`[Probador] Solicitando carga de modelo 3D: ${url} (tipo: ${kind})`);
      this.garment.prepareForModelLoad();
      void this.garment
        .loadModel(url, kind)
        .then(() => {
          console.log(`[Probador] Modelo 3D cargado correctamente: ${url}`);
        })
        .catch((err) => {
          console.error(`[Probador] Error al cargar modelo 3D (${url}):`, err);
          this.garment.useGarment(this.currentAppearance().type);
        });
      return;
    }
    this.garment.useGarment(this.currentAppearance().type);
  }

  private async openCamera(): Promise<void> {
    this.stopCamera();
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
    }
    this.stream = stream;

    // Permitir a Angular renderizar el nodo <video> si estaba en @if (!started())
    let video = this.video()?.nativeElement;
    if (!video) {
      await new Promise((r) => setTimeout(r, 120));
      video = this.video()?.nativeElement;
    }
    if (!video) throw new Error('Elemento de video no disponible');

    video.srcObject = stream;
    video.muted = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    await new Promise<void>((resolve) => {
      if (video!.readyState >= 2) {
        resolve();
        return;
      }
      const onReady = () => {
        video!.removeEventListener('loadeddata', onReady);
        video!.removeEventListener('canplay', onReady);
        resolve();
      };
      video!.addEventListener('loadeddata', onReady);
      video!.addEventListener('canplay', onReady);
      setTimeout(resolve, 1500);
    });

    await Promise.race([
      video.play(),
      new Promise((r) => setTimeout(r, 1500)),
    ]).catch(() => undefined);

    this.cameraOn.set(true);
    this.lastVideoTime = -1;
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.cameraOn.set(false);
    this.bodyDetected.set(false);
    this.clearSkeleton();
  }

  onFit(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.fit.set(Number.isFinite(value) ? Math.min(this.MAX_FIT, Math.max(this.MIN_FIT, value)) : 1);
    this.size.set('M');
  }

  onSkeleton(event: Event): void {
    this.showSkeleton.set((event.target as HTMLInputElement).checked);
  }

  pickSize(s: string): void {
    this.size.set(s);
  }

  typeLabel(type: GarmentType): string {
    return type === 'top' ? 'superior' : type === 'dress' ? 'vestido' : 'pantalón';
  }

  private colorHex(): string {
    const custom = this.colors()[this.colorIdx()];
    return custom?.hex ?? '#111827';
  }

  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartFit = 1;
  private touchInitialDist = 0;
  private lastTapTime = 0;

  onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - this.lastTapTime < 350) {
        // Doble toque: restablece la posición y la escala
        this.manualOffsetX.set(0);
        this.manualOffsetY.set(0);
        this.fit.set(1);
        this.lastTapTime = 0;
        return;
      }
      this.lastTapTime = now;
      this.touchStartX = e.touches[0].clientX - this.manualOffsetX();
      this.touchStartY = e.touches[0].clientY - this.manualOffsetY();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchInitialDist = Math.hypot(dx, dy);
      this.touchStartFit = this.fit();
    }
  }

  onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1 && this.touchInitialDist === 0) {
      // Arrastrar con 1 dedo desplaza la prenda sobre el cuerpo
      const x = e.touches[0].clientX - this.touchStartX;
      const y = e.touches[0].clientY - this.touchStartY;
      this.manualOffsetX.set(Math.max(-250, Math.min(250, x)));
      this.manualOffsetY.set(Math.max(-250, Math.min(250, y)));
    } else if (e.touches.length === 2 && this.touchInitialDist > 0) {
      // Pellizcar con 2 dedos escala la prenda directamente
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / this.touchInitialDist;
      const newFit = Math.min(this.MAX_FIT, Math.max(this.MIN_FIT, this.touchStartFit * ratio));
      this.fit.set(Number(newFit.toFixed(2)));
    }
  }

  onTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.touchInitialDist = 0;
    }
  }

  private currentAppearance(): FittingAppearance {
    const inferred = this.autoType() ?? 'top';
    const type = this.type() === 'auto' ? inferred : (this.type() as GarmentType);
    const fit = this.size() !== 'M' ? (SIZE_FIT[this.size()] ?? 1) : this.fit();
    return {
      type,
      color: this.colorHex(),
      fit,
      minConfidence: 0.3,
      offsetX: this.manualOffsetX(),
      offsetY: this.manualOffsetY(),
    };
  }

  /* --------------------------------------------------------- Detección ----- */

  private beginLoop(): void {
    cancelAnimationFrame(this.raf);
    const loop = (now: number): void => {
      this.raf = requestAnimationFrame(loop);
      if (!this.cameraOn() || !this.glReady) return;
      this.tick(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private tick(now: number): void {
    const video = this.video()?.nativeElement;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = video.currentTime;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 720;
    if (w !== this.lastW || h !== this.lastH) {
      this.lastW = w;
      this.lastH = h;
      this.garment.resize(w, h);
    }

    const result = this.pose.detect(video, now);
    if (this.showSkeleton()) {
      const lm = result?.landmarks?.[0];
      if (lm && lm.length > 0) {
        this.drawSkeleton(lm, w, h);
      } else {
        this.clearSkeleton();
      }
    }
    const raw = toPose(result, w, h);
    if (!raw) {
      this.bodyDetected.set(false);
      this.garment.update(null, this.currentAppearance());
      this.garment.render();
      return;
    }
    this.bodyDetected.set(true);
    this.smooth = smooth(this.smooth, raw, 0.45);
    this.garment.setGarment(this.currentAppearance().type);
    this.garment.update(this.smooth, this.currentAppearance());
    this.garment.render();
  }

  /* --------------------------------------------------------- Esqueleto ----- */

  /**
   * Debug CU17: pinta los 33 landmarks + conexiones de la pose encima del video.
   * El canvas usa la misma transformación espejo que el video, así que las
   * coordenadas normalizadas de MediaPipe se ven alineadas sobre el cuerpo.
   */
  private drawSkeleton(lm: NormalizedLandmark[], w: number, h: number): void {
    const canvas = this.overlay()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    this.skeletonUtils ??= new DrawingUtils(ctx);
    ctx.clearRect(0, 0, w, h);
    this.skeletonUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
      color: '#00e5ff',
      lineWidth: 2,
    });
    this.skeletonUtils.drawLandmarks(lm, { color: '#ffea00', radius: 3 });
  }

  private clearSkeleton(): void {
    const canvas = this.overlay()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* --------------------------------------------------------- Captura ------- */

  capture(): void {
    const video = this.video()?.nativeElement;
    if (!this.glReady || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.notice.set('Espera a que la cámara te detecte.');
      return;
    }
    const dataUrl = this.garment.capture(video);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `fashionstore-vestidor-${this.product()?.id ?? 0}.png`;
    link.click();
    this.notice.set('Foto guardada como PNG.');
    void this.saveSession();
  }

  /** CU17 persistencia: registra la sesión de prueba en el backend (best-effort). */
  private async saveSession(): Promise<void> {
    if (this.savedSession) return;
    if (!localStorage.getItem('fashionstore_access_token')) return;
    this.savedSession = true;
    try {
      const session = await firstValueFrom(
        this.experience.createFittingSession({
          model_url: null,
          model_format: 'gltf',
          model_metadata: { product_id: this.product()?.id },
        }),
      );
      if (!session) return;
      await firstValueFrom(
        this.experience.completeFittingSession(session.id, { status: 'completada' }),
      );
    } catch {
      this.savedSession = false;
    }
  }
}

/* --------------------------------------------------- utilidades de pose ---- */

function mid(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function sub(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function unit(a: { x: number; y: number }) {
  return { x: a.x / (Math.hypot(a.x, a.y) || 1), y: a.y / (Math.hypot(a.x, a.y) || 1) };
}

function toPose(result: PoseLandmarkerResult | null, w: number, h: number): FittingPose | null {
  const lm = result?.landmarks?.[0];
  if (!lm || lm.length < 25) return null;
  const ls = lm[LANDMARK.leftShoulder];
  const rs = lm[LANDMARK.rightShoulder];
  const lh = lm[LANDMARK.leftHip];
  const rh = lm[LANDMARK.rightHip];
  if (!ls || !rs) return null;

  const flip = (p: { x: number; y: number }) => ({ x: (1 - p.x) * w, y: p.y * h });
  const sL = flip(ls);
  const sR = flip(rs);
  const neck = mid(sL, sR);
  const sw = dist(sL, sR);

  const shoulderVis = ((ls.visibility ?? 0) + (rs.visibility ?? 0)) / 2;
  if (shoulderVis < 0.3) return null;

  // Detección facial precisa para gafas, gorras y sombreros
  let eyes: { x: number; y: number } | undefined;
  let eyeSpan: number | undefined;
  let nose: { x: number; y: number } | undefined;
  let wrist: { x: number; y: number } | undefined;

  const le = lm[LANDMARK.leftEye];
  const re = lm[LANDMARK.rightEye];
  if (le && re && ((le.visibility ?? 1) > 0.35 || (re.visibility ?? 1) > 0.35)) {
    const pLe = flip(le);
    const pRe = flip(re);
    eyes = mid(pLe, pRe);
    eyeSpan = dist(pLe, pRe);
  }

  const n = lm[LANDMARK.nose];
  if (n && (n.visibility ?? 1) > 0.35) {
    nose = flip(n);
  }

  const lw = lm[LANDMARK.leftWrist];
  const rw = lm[LANDMARK.rightWrist];
  if (lw && (lw.visibility ?? 0) > 0.4) {
    wrist = flip(lw);
  } else if (rw && (rw.visibility ?? 0) > 0.4) {
    wrist = flip(rw);
  }

  // Eje del torso: perpendicular a la línea de hombros, siempre hacia abajo en el video.
  const across = unit(sub(sL, sR));
  let down: { x: number; y: number } = { x: -across.y, y: across.x };
  if (down.y < 0) down = { x: -down.x, y: -down.y };

  const hipVis = ((lh?.visibility ?? 0) + (rh?.visibility ?? 0)) / 2;
  let hL: { x: number; y: number };
  let hR: { x: number; y: number };
  if (lh && rh && hipVis >= 0.5) {
    hL = flip(lh);
    hR = flip(rh);
  } else {
    // Cadera fuera de cuadro (sentado frente al escritorio): se estima bajo los
    // hombros siguiendo el eje del torso (heurística del probador de referencia).
    hL = {
      x: neck.x + down.x * sw * 1.3 - across.x * sw * 0.15,
      y: neck.y + down.y * sw * 1.3,
    };
    hR = {
      x: neck.x + down.x * sw * 1.3 + across.x * sw * 0.15,
      y: neck.y + down.y * sw * 1.3,
    };
  }

  const hip = mid(hL, hR);

  return {
    neck,
    hip,
    eyes,
    eyeSpan,
    nose,
    wrist,
    shoulderHalf: sw / 2,
    hipHalf: dist(hL, hR) / 2,
    torso: dist(neck, hip),
    angle: Math.atan2(sR.y - sL.y, sR.x - sL.x),
    confidence: shoulderVis,
  };
}

function smooth(prev: FittingPose | null, next: FittingPose, k: number): FittingPose {
  if (next.confidence < 0.3) {
    return prev ? { ...prev, confidence: next.confidence } : { ...next };
  }
  if (!prev) return { ...next };
  const lerp = (a: number, b: number) => a + (b - a) * k;
  return {
    neck: { x: lerp(prev.neck.x, next.neck.x), y: lerp(prev.neck.y, next.neck.y) },
    hip: { x: lerp(prev.hip.x, next.hip.x), y: lerp(prev.hip.y, next.hip.y) },
    eyes:
      next.eyes && prev.eyes
        ? { x: lerp(prev.eyes.x, next.eyes.x), y: lerp(prev.eyes.y, next.eyes.y) }
        : (next.eyes ?? prev.eyes),
    eyeSpan:
      next.eyeSpan && prev.eyeSpan
        ? lerp(prev.eyeSpan, next.eyeSpan)
        : (next.eyeSpan ?? prev.eyeSpan),
    nose:
      next.nose && prev.nose
        ? { x: lerp(prev.nose.x, next.nose.x), y: lerp(prev.nose.y, next.nose.y) }
        : (next.nose ?? prev.nose),
    wrist:
      next.wrist && prev.wrist
        ? { x: lerp(prev.wrist.x, next.wrist.x), y: lerp(prev.wrist.y, next.wrist.y) }
        : (next.wrist ?? prev.wrist),
    shoulderHalf: lerp(prev.shoulderHalf, next.shoulderHalf),
    hipHalf: lerp(prev.hipHalf, next.hipHalf),
    torso: lerp(prev.torso, next.torso),
    angle: lerp(prev.angle, next.angle),
    confidence: next.confidence,
  };
}

function msg(err?: unknown): string {
  if (err instanceof Error) return err.message;
  return 'No se pudo acceder a la cámara. Revisa los permisos del navegador.';
}