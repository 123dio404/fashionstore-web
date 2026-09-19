import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReportsService } from '../../core/services/reports.service';
import {
  AnalyticalQueryResponse,
  SpeechAnalyticalQueryResponse
} from '../../models';

@Component({
  selector: 'app-analytical-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Reportes analíticos por voz / IA</h2>
    <p class="muted">
      Consulta en lenguaje natural (texto o audio). El backend interpreta la intención con IA y
      responde con métricas.
    </p>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <div class="card">
      <h3>Consulta por texto</h3>
      <div class="row">
        <input
          placeholder="Ej: ventas del último mes por sucursal"
          [(ngModel)]="query"
          style="flex: 1"
        />
        <button class="btn-primary" [disabled]="!query.trim() || loading()" (click)="ask()">
          {{ loading() ? 'Consultando...' : 'Consultar' }}
        </button>
      </div>
    </div>

    <div class="card">
      <h3>Consulta por voz</h3>
      <div class="row">
        <input type="file" accept="audio/*" (change)="onFile($event)" />
        <button class="btn-primary" [disabled]="!audio || loadingVoice()" (click)="askVoice()">
          {{ loadingVoice() ? 'Procesando...' : 'Enviar audio' }}
        </button>
      </div>
      @if (transcript()) {
        <p class="muted">Transcripción: "{{ transcript() }}"</p>
      }
    </div>

    @if (result(); as response) {
      <div class="card">
        <h3>Resultado</h3>
        <p><strong>Consulta:</strong> {{ response.query }}</p>
        <p><strong>Intención detectada:</strong> <span class="badge">{{ response.intent }}</span></p>
        <h4>Parámetros</h4>
        <pre>{{ response.parameters | json }}</pre>
        <h4>Resultado</h4>
        <pre>{{ response.result | json }}</pre>
      </div>
    }
  `
})
export class AnalyticalPage {
  private readonly reports = inject(ReportsService);

  query = '';
  audio: File | null = null;
  readonly transcript = signal<string | null>(null);
  readonly result = signal<AnalyticalQueryResponse | null>(null);
  readonly loading = signal(false);
  readonly loadingVoice = signal(false);
  readonly error = signal<string | null>(null);

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.audio = input.files?.[0] ?? null;
  }

  ask(): void {
    this.loading.set(true);
    this.error.set(null);
    this.transcript.set(null);
    this.reports.analyticalQuery({ query: this.query }).subscribe({
      next: (response) => {
        this.result.set(response);
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
        this.loadingVoice.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loadingVoice.set(false);
      }
    });
  }
}
