import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ReportsService } from '../../core/services/reports.service';
import {
  AnalyticalQueryResponse,
  SpeechAnalyticalQueryResponse
} from '../../models';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';

interface Metric {
  label: string;
  value: string;
}

interface HistoryEntry {
  query: string;
  intent: string;
}

/** CU24 — Reportes analíticos por voz/IA: consulta en lenguaje natural, métricas e historial de sesión. */
@Component({
  selector: 'app-analytical-page',
  imports: [CommonModule, FormsModule, RouterLink, UiEmptyComponent],
  templateUrl: './analytical.page.html',
  styleUrl: './reports.scss'
})
export class AnalyticalPage {
  private readonly reports = inject(ReportsService);

  readonly suggestions = [
    'ventas del último mes por sucursal',
    'productos más vendidos',
    'stock bajo mínimo',
    'ingresos por canal'
  ];

  query = '';
  audio: File | null = null;
  readonly transcript = signal<string | null>(null);
  readonly result = signal<AnalyticalQueryResponse | null>(null);
  readonly loading = signal(false);
  readonly loadingVoice = signal(false);
  readonly error = signal<string | null>(null);
  readonly history = signal<HistoryEntry[]>([]);

  /** El motor no está disponible: el backend avisa cuando el servicio de IA no está configurado. */
  readonly serviceOff = computed(() =>
    /no configurad|not configured|api.?key|openai|disabled|sin servicio|no disponible/i.test(
      this.error() ?? ''
    )
  );

  /** Métricas numéricas del resultado, listas para mostrar en tarjetas. */
  readonly metrics = computed<Metric[]>(() => {
    const raw = this.result()?.result ?? {};
    return Object.entries(raw)
      .filter(([, value]) => typeof value === 'number')
      .map(([key, value]) => ({
        label: this.pretty(key),
        value: this.format(key, Number(value))
      }));
  });

  readonly parameters = computed<Array<{ label: string; value: string }>>(() =>
    Object.entries(this.result()?.parameters ?? {}).map(([key, value]) => ({
      label: this.pretty(key),
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }))
  );

  useSuggestion(suggestion: string): void {
    this.query = suggestion;
    this.ask();
  }

  readonly recording = signal(false);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recognition: any = null;

  toggleLiveRecording(): void {
    if (this.recording()) {
      this.stopLiveRecording();
    } else {
      this.startLiveRecording();
    }
  }

  private startLiveRecording(): void {
    this.error.set(null);
    this.audioChunks = [];

    // Transcripción en vivo en español si el navegador cuenta con SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-BO';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          if (text) {
            this.query = text;
            this.transcript.set(text);
          }
        };
        this.recognition.start();
      } catch (e) {
        console.warn('SpeechRecognition no iniciado:', e);
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };
        this.mediaRecorder.onstop = () => {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const blob = new Blob(this.audioChunks, { type: mimeType });
          this.audio = new File([blob], `pregunta_voz_${Date.now()}.webm`, { type: mimeType });
          stream.getTracks().forEach((track) => track.stop());

          if (this.query.trim()) {
            this.ask();
          } else {
            this.askVoice();
          }
        };
        this.mediaRecorder.start();
        this.recording.set(true);
      }).catch((err) => {
        this.error.set('No se pudo acceder al micrófono: ' + (err.message || 'Permiso denegado'));
        this.recording.set(false);
      });
    } else {
      this.error.set('Tu navegador no soporta grabación directa de audio.');
    }
  }

  private stopLiveRecording(): void {
    this.recording.set(false);
    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) {}
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.audio = input.files?.[0] ?? null;
  }

  ask(): void {
    if (!this.query.trim()) return;
    this.loading.set(true);
    this.error.set(null);
    this.transcript.set(null);
    this.reports.analyticalQuery({ query: this.query }).subscribe({
      next: (response) => {
        this.result.set(response);
        this.pushHistory(response);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  askVoice(): void {
    if (!this.audio) return;
    this.loadingVoice.set(true);
    this.error.set(null);
    this.reports.analyticalQueryVoice(this.audio).subscribe({
      next: (response: SpeechAnalyticalQueryResponse) => {
        this.transcript.set(response.transcript);
        this.result.set(response);
        this.query = response.query;
        this.pushHistory(response);
        this.loadingVoice.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loadingVoice.set(false);
      }
    });
  }

  private pushHistory(response: AnalyticalQueryResponse): void {
    this.history.update((items) => [
      { query: response.query, intent: response.intent },
      ...items
    ].slice(0, 8));
  }

  private pretty(key: string): string {
    return key.replace(/_/g, ' ');
  }

  private format(key: string, value: number): string {
    const isMoney = /revenue|ingreso|amount|total_spent|average|value/.test(key);
    const formatted = value.toLocaleString('es-BO', { maximumFractionDigits: 2 });
    return isMoney ? `Bs. ${formatted}` : formatted;
  }
}
