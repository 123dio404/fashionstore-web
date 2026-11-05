import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiReportsService } from '../../core/services/ai-reports.service';

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.page.html',
  styleUrls: ['./ai-assistant.page.scss']
})
export class AiAssistantPage {
  private ai = inject(AiReportsService);

  query = signal('');
  loading = signal(false);
  response = signal<any>(null);
  recognizing = signal(false);

  ask() {
    const q = this.query().trim();
    if (!q) return;
    this.loading.set(true);
    this.ai.queryReport(q).subscribe({
      next: (res) => { this.response.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); alert('Error al consultar asistente IA'); }
    });
  }

  startVoice() {
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Reconocimiento de voz no soportado en este navegador');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
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

  exportPdf() {
    const data = this.response();
    if (!data) return;
    this.ai.exportPdf(data).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte-ia.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  exportExcel() {
    const data = this.response();
    if (!data) return;
    this.ai.exportExcel(data).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte-ia.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
