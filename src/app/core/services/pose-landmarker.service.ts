import { Injectable } from '@angular/core';
import {
  FilesetResolver,
  PoseLandmarker,
  PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

/**
 * CU17 — Detección de pose con PoseLandmarker (MediaPipe) para el vestidor web.
 * BlazePose provee hombros y caderas en cada fotograma para que la prenda 3D
 * se sobreponga al cuerpo de la cámara y se ajuste a sus medidas.
 */

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

export interface FittingPose {
  /** Cuello = punto medio entre hombros (canvas, ya espejado). */
  neck: { x: number; y: number };
  /** Punto medio entre caderas. */
  hip: { x: number; y: number };
  /** Medias medias del cuerpo: medio ancho de hombros y caderas, torso. */
  shoulderHalf: number;
  hipHalf: number;
  torso: number;
  /** Inclinación de la línea de hombros en radianes (canvas, y hacia abajo). */
  angle: number;
  confidence: number;
}

@Injectable({ providedIn: 'root' })
export class PoseLandmarkerService {
  private landmarker: PoseLandmarker | null = null;
  private loading: Promise<PoseLandmarker> | null = null;

  /** Carga el modelo una sola vez con fallback GPU → CPU. */
  load(): Promise<PoseLandmarker> {
    if (this.landmarker) return Promise.resolve(this.landmarker);
    this.loading ??= (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      this.landmarker = await this.createWithFallback(vision);
      return this.landmarker;
    })().catch((err: unknown) => {
      this.loading = null;
      throw err; // Permite reintentar si falla la carga (CDN/GPU).
    });
    return this.loading;
  }

  private async createWithFallback(
    vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  ): Promise<PoseLandmarker> {
    type Options = Parameters<typeof PoseLandmarker.createFromOptions>[1];
    const options: Options = {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };
    try {
      return await PoseLandmarker.createFromOptions(vision, options);
    } catch {
      return await PoseLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'CPU' },
      });
    }
  }

  /** Detección para un fotograma de video (timestamp ms). */
  detect(video: HTMLVideoElement, timestampMs: number): PoseLandmarkerResult | null {
    if (!this.landmarker) return null;
    return this.landmarker.detectForVideo(video, timestampMs);
  }

  destroy(): void {
    this.landmarker?.close();
    this.landmarker = null;
    this.loading = null;
  }
}