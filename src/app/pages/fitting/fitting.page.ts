import { CommonModule } from '@angular/common';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { firstValueFrom } from 'rxjs';

import { FigmaColor, FigmaProduct } from '../../core/figma-data';
import { CatalogStore } from '../../core/services/catalog-store.service';
import { ExperienceService } from '../../core/services/experience.service';
import {
  FittingAppearance,
  Garment3DService,
  GarmentType,
} from '../../core/services/garment3d.service';
import { FittingPose, PoseLandmarkerService } from '../../core/services/pose-landmarker.service';

type GarmentChoice = 'auto' | GarmentType;

const LANDMARK = {
  leftShoulder: 11,
  rightShoulder: 12,
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

  readonly product = signal<FigmaProduct | undefined>(undefined);
  readonly started = signal(false);
  readonly error = signal<string | null>(null);
  readonly phase = signal<'model' | 'camera' | 'ready'>('model');
  readonly cameraOn = signal(false);
  readonly bodyDetected = signal(false);
  readonly type = signal<GarmentChoice>('auto');
  readonly size = signal('M');
  readonly fit = signal(1);
  readonly colorIdx = signal(0);
  readonly notice = signal<string | null>(null);

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
  private savedSession = false;
  private glReady = false;

  readonly sizes = computed(() => this.product()?.sizes ?? ['XS', 'S', 'M', 'L', 'XL']);
  readonly colors = computed(() => {
    const colors = this.product()?.colors ?? [];
    return colors.length ? colors : ([{ name: 'Negro', hex: '#111827' }] as FigmaColor[]);
  });

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
      const id = Number(params.get('id'));
      this.started.set(false);
      this.bodyDetected.set(false);
      this.notice.set(null);
      this.product.set(this.store.byId(id));
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
    this.phase.set('model');
    void this.pose
      .load()
      .then(() => {
        this.phase.set('camera');
        return this.openCamera();
      })
      .then(() => {
        this.initGl();
        this.phase.set('ready');
        this.savedSession = false;
        this.beginLoop();
      })
      .catch((err: unknown) => {
        this.error.set(msg(err));
        this.phase.set('camera');
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
    this.garment.create(host, 640, 720);
    this.glReady = true;
  }

  private async openCamera(): Promise<void> {
    this.stopCamera();
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 720 } },
      audio: false,
    });
    const video = this.video()?.nativeElement;
    if (!video) throw new Error('elemento de video no disponible');
    video.srcObject = this.stream;
    await video.play().catch(() => undefined);
    this.cameraOn.set(true);
    this.lastVideoTime = -1;
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.cameraOn.set(false);
    this.bodyDetected.set(false);
  }

  onFit(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.fit.set(Number.isFinite(value) ? Math.min(this.MAX_FIT, Math.max(this.MIN_FIT, value)) : 1);
    this.size.set('M');
  }

  pickSize(s: string): void {
    this.size.set(s);
  }

  typeLabel(type: GarmentType): string {
    return type === 'top' ? 'superior' : type === 'dress' ? 'vestido' : 'pantalón';
  }

  private colorHex(): string {
    const index = Math.min(this.colorIdx(), this.colors().length);
    return (this.colors()[index] ?? this.colors()[0]).hex;
  }

  private currentAppearance(): FittingAppearance {
    const inferred = this.autoType() ?? 'top';
    const type = this.type() === 'auto' ? inferred : (this.type() as GarmentType);
    const fit = this.size() !== 'M' ? (SIZE_FIT[this.size()] ?? 1) : this.fit();
    return { type, color: this.colorHex(), fit, minConfidence: 0.4 };
  }

  /* --------------------------------------------------------- Detección ----- */

  private beginLoop(): void {
    cancelAnimationFrame(this.raf);
    const loop = (now: number): void => {
      if (!this.cameraOn() || !this.glReady) return;
      this.raf = requestAnimationFrame(loop);
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

function toPose(result: PoseLandmarkerResult | null, w: number, h: number): FittingPose | null {
  const lm = result?.landmarks?.[0];
  if (!lm || lm.length < 25) return null;
  const ls = lm[LANDMARK.leftShoulder];
  const rs = lm[LANDMARK.rightShoulder];
  const lh = lm[LANDMARK.leftHip];
  const rh = lm[LANDMARK.rightHip];
  if (!ls || !rs || !lh || !rh) return null;

  const flip = (p: { x: number; y: number }) => ({ x: (1 - p.x) * w, y: p.y * h });
  const sL = flip(ls);
  const sR = flip(rs);
  const hL = flip(lh);
  const hR = flip(rh);
  const neck = mid(sL, sR);
  const hip = mid(hL, hR);

  const visibility =
    (ls.visibility ?? 1) + (rs.visibility ?? 1) + (lh.visibility ?? 1) + (rh.visibility ?? 1);

  return {
    neck,
    hip,
    shoulderHalf: dist(sL, sR) / 2,
    hipHalf: dist(hL, hR) / 2,
    torso: dist(neck, hip),
    angle: Math.atan2(sR.y - sL.y, sR.x - sL.x),
    confidence: visibility / 4,
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