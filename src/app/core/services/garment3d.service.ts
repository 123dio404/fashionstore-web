import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { FittingPose } from './pose-landmarker.service';

export type GarmentType = 'top' | 'dress' | 'bottom';
export type ModelKind = 'garment' | 'shoe' | 'sunglasses';

export interface FittingAppearance {
  type: GarmentType;
  color: string;
  fit: number;
  /** Umbral de confianza de pose para no dibujar la prenda. */
  minConfidence: number;
}

interface GarmentPart {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  pos: Float32Array;
  uSeg: number;
  vSeg: number;
  /** 0 = bloque superior (torso/vestido/caderas); -1/+1 = pierna izquierda/derecha. */
  leg: 0 | -1 | 1;
}

/**
 * CU17 — Prenda 3D del vestidor web.
 *
 * Renderiza una malla tridimensional de la prenda (superficie curvada, con
 * iluminación y grosor) arriba de la cámara. Cada fotograma regenera los
 * vértices a partir de la pose: escala al ancho de hombros/caderas, sigue y
 * rota con el torso (eje Z) para que la prenda "se ajuste al cuerpo".
 */
@Injectable({ providedIn: 'root' })
export class Garment3DService {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.OrthographicCamera;
  private readonly scene = new THREE.Scene();
  private readonly group = new THREE.Group();
  private readonly light = new THREE.DirectionalLight(0xffffff, 0.95);

  private parts: GarmentPart[] = [];
  private w = 0;
  private h = 0;
  private current: GarmentType = 'top';

  /** Producto 3D real cargado (zapato/gafas) que reemplaza a la malla de cuerpo. */
  private model: THREE.Object3D | null = null;
  private modelKind: ModelKind = 'garment';
  /** Dimensión máxima del modelo en unidades del glTF (para escalarlo a píxeles). */
  private modelNaturalSize = 1;
  /** Par de zapatos: el modelo cargado se clona y se espeja para ambos pies. */
  private shoeLeft: THREE.Object3D | null = null;
  private shoeRight: THREE.Object3D | null = null;
  private readonly loader = new GLTFLoader();

  /** Crea el contexto WebGL y anexa su lienzo transparente a la escena. */
  create(parent: HTMLElement, w: number, h: number): void {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.className = 'mirror-canvas';
    // El canvas se crea en runtime (appendChild), así que Angular no le aplica
    // los estilos scoped del componente (_ngcontent). Se ponen inline para que
    // quede encima del video, como el esqueleto.
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'cover';
    canvas.style.pointerEvents = 'none';
    parent.appendChild(canvas);

    this.scene.add(this.group);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-180, -120, 120);
    this.scene.add(fill);
    this.scene.add(this.light);
    this.light.position.set(180, 240, 160);
    this.buildGarment(this.current);
    this.resize(w, h);
  }

  /** Cambia la silueta 3D (superior / vestido / pantalón). */
  setGarment(type: GarmentType): void {
    if (this.model || type === this.current) return;
    this.current = type;
    this.disposeParts();
    this.buildGarment(type);
  }

  /** Carga un producto 3D real (glb/gltf) y lo ancla a la pose del cuerpo. */
  async loadModel(url: string, kind: ModelKind): Promise<void> {
    this.unloadModel();
    const gltf = await this.loader.loadAsync(url);
    this.disposeParts();
    const scene = gltf.scene;
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    this.modelNaturalSize = Math.max(size.x, size.y, size.z, 0.001);
    this.group.add(scene);
    this.model = scene;
    this.modelKind = kind;

    // Los zapatos se muestran como par: el objeto cargado (que sirve de patrón)
    // se oculta y se clonan dos copias espejadas para cada pie.
    if (kind === 'shoe') {
      scene.visible = false;
      this.shoeLeft = scene.clone(true);
      this.shoeRight = scene.clone(true);
      this.shoeLeft.visible = true;
      this.shoeRight.visible = true;
      this.group.add(this.shoeLeft, this.shoeRight);
    }
  }

  /** Vuelve a la malla de cuerpo (tras haber usado un modelo real). */
  useGarment(type: GarmentType): void {
    this.unloadModel();
    this.current = type;
    this.disposeParts();
    this.buildGarment(type);
  }

  unloadModel(): void {
    if (!this.model) return;
    // Los clones del par comparten geometría/material con el patrón; se quitan
    // antes de liberar los recursos del modelo que ya no se va a usar.
    this.shoeLeft?.removeFromParent();
    this.shoeRight?.removeFromParent();
    this.shoeLeft = null;
    this.shoeRight = null;
    this.model.removeFromParent();
    this.model.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((entry) => entry?.dispose?.());
      else material?.dispose?.();
    });
    this.model = null;
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    const halfW = w / 2;
    const halfH = h / 2;
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -200, 200);
    this.camera.position.z = 10;
  }

  /** Regenera los vértices según la pose y deja el grupo listo para renderizar. */
  update(pose: FittingPose | null, appearance: FittingAppearance): void {
    if (!pose || pose.confidence < appearance.minConfidence) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    if (this.model) {
      this.placeModel(pose);
      return;
    }

    const anchor = appearance.type === 'bottom' ? pose.hip : pose.neck;
    const wx = anchor.x - this.w / 2;
    const wy = this.h / 2 - anchor.y;
    this.group.position.set(wx, wy, 0);
    this.group.rotation.z = -pose.angle;
    this.light.position.set(wx - this.w * 0.12, wy + this.h * 0.1, 60);

    const fit = appearance.fit;
    for (const part of this.parts) {
      part.material.color.set(appearance.color);
      if (part.leg === 0) {
        if (appearance.type === 'bottom') this.fillPelvis(part, pose, fit);
        else this.fillTorso(part, pose, appearance.type, fit);
      } else {
        this.fillLeg(part, pose, fit, part.leg);
      }
      part.mesh.geometry.attributes['position'].needsUpdate = true;
      part.mesh.geometry.computeVertexNormals();
    }
  }

  render(): void {
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  }

  /** PNG final: cámara espejada + prenda 3D. */
  capture(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.w;
    canvas.height = this.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return this.renderer.domElement.toDataURL('image/png');
    ctx.save();
    ctx.translate(this.w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, this.w, this.h);
    ctx.restore();
    ctx.drawImage(this.renderer.domElement, 0, 0, this.w, this.h);
    return canvas.toDataURL('image/png');
  }

  dispose(): void {
    this.unloadModel();
    this.disposeParts();
    this.group.removeFromParent();
    this.renderer?.dispose();
  }

  /* ------------------------------------------------------- modelo real ---- */

  /**
   * Ancla el objeto 3D del producto a la pose (sin deformarlo): el zapato se
   * apoya en los pies y las gafas se colocan a la altura de la cara, siempre
   * siguiendo la posición y rotación del torso.
   */
  private placeModel(pose: FittingPose): void {
    if (!this.model) return;
    const isShoe = this.modelKind === 'shoe';
    const anchor = isShoe
      ? { x: pose.hip.x, y: pose.hip.y + pose.torso }
      : { x: pose.neck.x, y: pose.neck.y - pose.torso * 0.5 };

    // Escala el objeto al tamaño que tendría en el cuerpo: el zapato al largo
    // del pie y las gafas al ancho de la cara, respecto a la pose detectada.
    const targetPx = isShoe ? pose.torso * 0.5 : pose.shoulderHalf * 0.75;
    const scale = Math.max(targetPx / this.modelNaturalSize, 0.001);
    if (isShoe) {
      // Par de zapatos: uno a cada lado del eje del torso, con el pie izquierdo
      // espejado respecto al derecho. La suela se apoya en la línea del suelo.
      const span = pose.hipHalf * 1.1;
      this.shoeLeft?.position.set(-span, 0, 0);
      this.shoeLeft?.scale.set(-scale, scale, scale);
      this.shoeRight?.position.set(span, 0, 0);
      this.shoeRight?.scale.set(scale, scale, scale);
    } else {
      this.model.scale.setScalar(scale);
    }

    const wx = anchor.x - this.w / 2;
    const wy = this.h / 2 - anchor.y;
    this.group.position.set(wx, wy, 0);
    this.group.rotation.z = -pose.angle;
    this.light.position.set(wx - this.w * 0.12, wy + this.h * 0.1, 60);
  }

  /* ------------------------------------------------------- geometries ----- */

  private buildGarment(type: GarmentType): void {
    // Cada prenda es una malla curva cerrada (tubo elíptico) cuyos perfiles se
    // regeneran por fotograma. Los pantalones unen un bloque de caderas + 2 piernas.
    const parts: { leg: 0 | -1 | 1; uSeg: number; vSeg: number }[] =
      type === 'bottom'
        ? [
            { leg: 0, uSeg: 14, vSeg: 10 },
            { leg: -1, uSeg: 10, vSeg: 20 },
            { leg: 1, uSeg: 10, vSeg: 20 },
          ]
        : [{ leg: 0, uSeg: 22, vSeg: 28 }];

    for (const spec of parts) {
      const uCount = spec.uSeg + 1;
      const vCount = spec.vSeg + 1;
      const pos = new Float32Array(uCount * vCount * 3);
      const idx = new Uint32Array(spec.uSeg * spec.vSeg * 6);
      for (let v = 0; v < spec.vSeg; v += 1) {
        for (let u = 0; u < spec.uSeg; u += 1) {
          const a = v * uCount + u;
          const b = a + 1;
          const c = (v + 1) * uCount + u;
          const d = c + 1;
          const k = (v * spec.uSeg + u) * 6;
          idx[k] = a;
          idx[k + 1] = c;
          idx[k + 2] = b;
          idx[k + 3] = b;
          idx[k + 4] = c;
          idx[k + 5] = d;
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geometry.setIndex(new THREE.BufferAttribute(idx, 1));

      const material = new THREE.MeshStandardMaterial({
        color: 0xe05a47,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.97,
        roughness: 0.82,
        metalness: 0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.group.add(mesh);
      this.parts.push({ mesh, material, pos, uSeg: spec.uSeg, vSeg: spec.vSeg, leg: spec.leg });
    }
  }

  /**
   * Interpola un perfil de silueta dado por puntos de control (f ∈ [0,1],
   * siendo 0 el borde superior de la pieza y 1 el dobladillo).
   */
  private spline(f: number, pts: Array<[number, number]>): number {
    for (let i = 0; i < pts.length - 1; i += 1) {
      const [f0, v0] = pts[i];
      const [f1, v1] = pts[i + 1];
      if (f <= f1) {
        const t = (f - f0) / (f1 - f0);
        return v0 + (v1 - v0) * t;
      }
    }
    return pts[pts.length - 1][1];
  }

  /**
   * Superior / vestido: tubo elíptico cerrado con cuello, caída de hombros,
   * talle y caderas (vestido con vuelo tipo A). El tubo da volumen real: la
   * mitad trasera queda oculta por profundidad y el dobladillo se ve elíptico.
   */
  private fillTorso(
    part: GarmentPart,
    pose: FittingPose,
    type: GarmentType,
    fit: number,
  ): void {
    const isDress = type === 'dress';
    // Potencias de ancho respecto al hombro detectado: cuello → deltoide →
    // brazo → talle → cadera → dobladillo.
    const xPts: Array<[number, number]> = isDress
      ? [
          [0, 0.56],
          [0.06, 1.16],
          [0.12, 1.05],
          [0.36, 0.82],
          [0.62, 1.18],
          [1, 1.98],
        ]
      : [
          [0, 0.56],
          [0.06, 1.16],
          [0.12, 1.03],
          [0.44, 0.74],
          [0.74, 0.94],
          [1, 1.04],
        ];
    // Perfil de profundidad (bulto del torso), fracción del torso.
    const zPts: Array<[number, number]> = isDress
      ? [
          [0, 1.5],
          [0.16, 2.2],
          [0.44, 1.7],
          [0.62, 1.9],
          [1, 2.4],
        ]
      : [
          [0, 1.5],
          [0.16, 2.2],
          [0.44, 1.6],
          [0.72, 1.9],
          [1, 2.1],
        ];
    const length = (isDress ? 1.8 : 1.25) * pose.torso * fit;
    const depthBase = pose.torso * fit * 0.06;
    // Escote: el borde superior baja al centro (frente de la prenda).
    const collarDip = pose.torso * (isDress ? 0.05 : 0.048);
    const uCount = part.uSeg + 1;
    const vCount = part.vSeg + 1;
    let i = 0;
    for (let v = 0; v < vCount; v += 1) {
      const f = v / part.vSeg;
      const rx = this.spline(f, xPts) * pose.shoulderHalf * fit;
      const rz = this.spline(f, zPts) * depthBase;
      for (let u = 0; u < uCount; u += 1) {
        const th = (u / part.uSeg) * Math.PI * 2;
        const dip = v === 0 ? collarDip * Math.max(0, Math.cos(th)) : 0;
        part.pos[i++] = rx * Math.sin(th);
        part.pos[i++] = -f * length - dip;
        part.pos[i++] = rz * Math.cos(th);
      }
    }
  }

  /** Pantalón: bloque de caderas/cintura desde donde cuelgan las dos piernas. */
  private fillPelvis(part: GarmentPart, pose: FittingPose, fit: number): void {
    const xPts: Array<[number, number]> = [
      [0, 0.84],
      [0.35, 0.97],
      [0.7, 1.02],
      [1, 1.0],
    ];
    const zPts: Array<[number, number]> = [
      [0, 1.4],
      [0.4, 1.9],
      [1, 2.0],
    ];
    const length = pose.torso * fit * 0.5;
    const depthBase = pose.torso * fit * 0.06;
    const uCount = part.uSeg + 1;
    const vCount = part.vSeg + 1;
    let i = 0;
    for (let v = 0; v < vCount; v += 1) {
      const f = v / part.vSeg;
      const rx = this.spline(f, xPts) * pose.hipHalf * fit;
      const rz = this.spline(f, zPts) * depthBase;
      for (let u = 0; u < uCount; u += 1) {
        const th = (u / part.uSeg) * Math.PI * 2;
        part.pos[i++] = rx * Math.sin(th);
        // Cintura un poco por encima de la línea de caderas.
        part.pos[i++] = pose.torso * fit * 0.06 - f * length;
        part.pos[i++] = rz * Math.cos(th);
      }
    }
  }

  /** Pierna de pantalón: tubo cónico con entrepierna convergente hacia el pie. */
  private fillLeg(part: GarmentPart, pose: FittingPose, fit: number, dir: 0 | -1 | 1): void {
    const uCount = part.uSeg + 1;
    const vCount = part.vSeg + 1;
    const length = pose.torso * fit * 1.75;
    const depthBase = pose.torso * fit * 0.05;
    const hip = pose.hipHalf * fit;
    let i = 0;
    for (let v = 0; v < vCount; v += 1) {
      const f = v / part.vSeg;
      // Las piernas arrancan juntas bajo el bloque de caderas y se separan poco.
      const cx = dir * (0.5 - 0.08 * f) * hip;
      const rx = (0.42 - 0.18 * f) * hip;
      const rz = (2.0 - 0.4 * f) * depthBase;
      const y = -f * length;
      for (let u = 0; u < uCount; u += 1) {
        const th = (u / part.uSeg) * Math.PI * 2;
        part.pos[i++] = cx + rx * Math.sin(th);
        part.pos[i++] = y;
        part.pos[i++] = rz * Math.cos(th);
      }
    }
  }

  private disposeParts(): void {
    for (const part of this.parts) {
      part.mesh.removeFromParent();
      part.mesh.geometry.dispose();
      part.material.dispose();
    }
    this.parts = [];
  }
}