import { Injectable } from '@angular/core';
import * as THREE from 'three';

import { FittingPose } from './pose-landmarker.service';

export type GarmentType = 'top' | 'dress' | 'bottom';

export interface FittingAppearance {
  type: GarmentType;
  color: string;
  fit: number;
  /** Umbral de confianza de pose para no dibujar la prenda. */
  minConfidence: number;
}

interface GarmentPart {
  mesh: THREE.Mesh;
  material: THREE.MeshLambertMaterial;
  pos: Float32Array;
  uSeg: number;
  vSeg: number;
  /** 0 = torso (superior/vestido); -1/+1 = pierna izquierda/derecha. */
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
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    this.scene.add(this.light);
    this.light.position.set(180, 240, 160);
    this.buildGarment(this.current);
    this.resize(w, h);
  }

  /** Cambia la silueta 3D (superior / vestido / pantalón). */
  setGarment(type: GarmentType): void {
    if (type === this.current) return;
    this.current = type;
    this.disposeParts();
    this.buildGarment(type);
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
        this.fillTorso(part, pose, appearance.type, fit);
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
    this.disposeParts();
    this.group.removeFromParent();
    this.renderer?.dispose();
  }

  /* ------------------------------------------------------- geometries ----- */

  private buildGarment(type: GarmentType): void {
    const parts: { leg: 0 | -1 | 1; uSeg: number; vSeg: number }[] =
      type === 'bottom'
        ? [
            { leg: -1, uSeg: 12, vSeg: 22 },
            { leg: 1, uSeg: 12, vSeg: 22 },
          ]
        : [{ leg: 0, uSeg: 18, vSeg: 28 }];

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

      const material = new THREE.MeshLambertMaterial({
        color: 0xe05a47,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.96,
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.group.add(mesh);
      this.parts.push({ mesh, material, pos, uSeg: spec.uSeg, vSeg: spec.vSeg, leg: spec.leg });
    }
  }

  private fillTorso(
    part: GarmentPart,
    pose: FittingPose,
    type: GarmentType,
    fit: number,
  ): void {
    const uCount = part.uSeg + 1;
    const vCount = part.vSeg + 1;
    const isDress = type === 'dress';
    const length = (isDress ? 2.05 : 1.28) * pose.torso * fit;
    const depth = pose.torso * fit * 0.07;
    let i = 0;
    for (let v = 0; v < vCount; v += 1) {
      const f = v / part.vSeg;
      const width =
        pose.shoulderHalf * fit * (isDress ? 1.05 + 0.8 * f : 1.05 + 0.5 * f);
      const y = -f * length;
      for (let u = 0; u < uCount; u += 1) {
        const uu = (u / part.uSeg) * 2 - 1;
        part.pos[i++] = uu * width;
        part.pos[i++] = y;
        part.pos[i++] = depth * (0.3 - 0.3 * uu * uu);
      }
    }
  }

  private fillLeg(part: GarmentPart, pose: FittingPose, fit: number, dir: 0 | -1 | 1): void {
    const uCount = part.uSeg + 1;
    const vCount = part.vSeg + 1;
    const length = pose.torso * fit * 1.7;
    const depth = pose.torso * fit * 0.06;
    const gap = pose.hipHalf * fit * 0.55;
    let i = 0;
    for (let v = 0; v < vCount; v += 1) {
      const f = v / part.vSeg;
      const legWidth = pose.hipHalf * fit * (0.92 + 0.28 * f);
      const center = dir * (gap + legWidth / 2);
      const y = -f * length;
      for (let u = 0; u < uCount; u += 1) {
        const t = u / part.uSeg;
        const uu = t * 2 - 1;
        part.pos[i++] = center + (t - 0.5) * legWidth;
        part.pos[i++] = y;
        part.pos[i++] = depth * (0.22 - 0.22 * uu * uu);
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