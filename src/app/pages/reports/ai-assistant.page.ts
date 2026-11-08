import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiReportsService } from '../../core/services/ai-reports.service';
import { AiReportResponse } from '../../models';

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.page.html',
  styleUrls: ['./ai-assistant.page.scss']
})
export class AiAssistantPage implements OnInit {
  private ai = inject(AiReportsService);

  readonly suggestions = [
    '¿Cuáles fueron las ventas por sucursal del último mes?',
    'Top 10 productos más vendidos por categoría',
    'Prendas con stock crítico y riesgo de agotamiento',
    'Comparativa de ventas de los últimos 3 meses entre sucursales'
  ];

  query = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  response = signal<AiReportResponse | null>(null);
  recognizing = signal(false);

  readonly chartRows = computed(() => {
    const res = this.response();
    if (!res?.datos_grafico?.labels?.length || !res?.datos_grafico?.datasets?.length) {
      return [];
    }
    const labels = res.datos_grafico.labels;
    const ds = res.datos_grafico.datasets[0];
    const values = (ds.data || []).map((v) => Number(v) || 0);
    const max = Math.max(...values, 1);
    return labels.map((label, idx) => {
      const val = values[idx] ?? 0;
      const pct = Math.min(100, Math.max(4, Math.round((val / max) * 100)));
      const bg = Array.isArray(ds.backgroundColor)
        ? ds.backgroundColor[idx % ds.backgroundColor.length]
        : (ds.backgroundColor || '#4F46E5');
      return { label, value: val, pct, color: bg, metricLabel: ds.label };
    });
  });

  ngOnInit(): void {
    this.useSuggestion(this.suggestions[0]);
  }

  useSuggestion(text: string): void {
    this.query.set(text);
    this.ask();
  }

  ask(): void {
    const q = this.query().trim();
    if (!q || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.ai.queryReport(q).subscribe({
      next: (res) => {
        this.response.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail || err?.message || 'No se pudo generar el reporte con IA.');
      }
    });
  }

  startVoice(): void {
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.error.set('El reconocimiento de voz requiere Google Chrome o Microsoft Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-BO';
    recognition.interimResults = false;
    recognition.onstart = () => this.recognizing.set(true);
    recognition.onend = () => this.recognizing.set(false);
    recognition.onerror = () => this.recognizing.set(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.query.set(transcript);
      this.ask();
    };
    recognition.start();
  }

  exportPdf(): void {
    const data = this.response();
    if (!data) return;
    this.ai.exportPdf(data).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-ia-${data.tipo_reporte || 'ejecutivo'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  exportExcel(): void {
    const data = this.response();
    if (!data) return;
    this.ai.exportExcel(data).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-ia-${data.tipo_reporte || 'ejecutivo'}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  formatCell(col: string, val: any): string {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') {
      if (col.includes('Bs.') || col.toLowerCase().includes('ingreso') || col.toLowerCase().includes('ticket') || col.toLowerCase().includes('trimestre')) {
        return `Bs. ${val.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return val.toLocaleString('es-BO');
    }
    return String(val);
  }
}
