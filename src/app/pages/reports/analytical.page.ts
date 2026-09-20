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
    const isMoney = /revenue|ingreso|amount|total_spent|average/.test(key);
    const formatted = value.toLocaleString('es-BO', { maximumFractionDigits: 2 });
    return isMoney ? `$ ${formatted}` : formatted;
  }
}
