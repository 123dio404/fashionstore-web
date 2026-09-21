import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ICONS } from '../../core/navigation';
import { ExperienceService } from '../../core/services/experience.service';
import { ChatConversationResponse, ChatMessageResponse } from '../../models';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';
import { UiIconComponent } from '../../shared/ui/icon.component';

const ICON_PLUS = ['M12 5v14', 'M5 12h14'];

interface QuickAction {
  label: string;
  icon: string;
}

/** CU19 — Chatbot «Aria»: réplica del frame de Chatbot del diseño web de Figma. */
const SUGGESTIONS = [
  '¿Cuándo llega mi pedido?',
  'Política de devoluciones',
  'Cambio de talla',
  '¿Tienen envío gratis?',
  'Cómo usar el AR',
  'Sucursales disponibles',
];

/** Iconos de línea de «Acciones rápidas» (mismos paths que el prototipo web de Figma). */
const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Estado de mi pedido',
    icon: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z',
  },
  {
    label: 'Política de devoluciones',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 0-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1m6 0h-6',
  },
  { label: 'Guía de tallas', icon: 'M3 3h18v4H3zM3 9h18v4H3zM3 15h18v4H3z' },
  {
    label: 'Horarios de tiendas',
    icon: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z',
  },
  {
    label: 'Ofertas del día',
    icon: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  },
  {
    label: 'Hablar con agente',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
];

/** CU19 — Asistente conversacional «Aria»: conversaciones, chat central y acciones rápidas. */
@Component({
  selector: 'app-chatbot-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent, UiIconComponent],
  templateUrl: './chatbot.page.html',
  styleUrl: './chatbot.page.scss',
})
export class ChatbotPage {
  private readonly experience = inject(ExperienceService);

  readonly icons = ICONS;
  readonly plus = ICON_PLUS;
  readonly suggestions = SUGGESTIONS;
  readonly quickActions = QUICK_ACTIONS;

  readonly conversations = signal<ChatConversationResponse[]>([]);
  readonly messages = signal<ChatMessageResponse[]>([]);
  readonly active = signal<ChatConversationResponse | null>(null);
  readonly sending = signal(false);
  readonly createDrawer = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  newTitle = '';
  draft = '';

  readonly filteredConversations = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.conversations();
    return this.conversations().filter(
      (c) =>
        (c.title || `Conversación #${c.id}`).toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  });

  @ViewChild('thread') private readonly thread?: ElementRef<HTMLDivElement>;

  constructor() {
    this.loadConversations();
  }

  isUser(message: ChatMessageResponse): boolean {
    return message.role?.toLowerCase() === 'user' || message.role?.toLowerCase() === 'cliente';
  }

  /** Envía una sugerencia o acción rápida: envía si hay conversación, si no, precarga el mensaje. */
  ask(text: string): void {
    if (this.active()) {
      this.draft = text;
      this.send();
    } else {
      this.draft = text;
    }
  }

  loadConversations(): void {
    this.experience.listConversations().subscribe({
      next: (data) => this.conversations.set(data),
      error: (err: Error) => this.error.set(err.message),
    });
  }

  create(): void {
    this.experience
      .createConversation({ title: this.newTitle || 'Asistente FashionStore' })
      .subscribe({
        next: (conversation) => {
          this.newTitle = '';
          this.createDrawer.set(false);
          this.active.set(conversation);
          this.messages.set(conversation.messages);
          this.loadConversations();
          this.scrollThread();
        },
        error: (err: Error) => this.error.set(err.message),
      });
  }

  open(id: number): void {
    this.experience.getConversation(id).subscribe({
      next: (conversation) => {
        this.active.set(conversation);
        this.messages.set(conversation.messages);
        this.scrollThread();
      },
      error: (err: Error) => this.error.set(err.message),
    });
  }

  send(): void {
    const conversation = this.active();
    if (!conversation || !this.draft.trim()) return;
    const content = this.draft.trim();
    this.sending.set(true);
    this.experience.sendMessage(conversation.id, { content }).subscribe({
      next: () => {
        this.draft = '';
        this.sending.set(false);
        this.open(conversation.id);
        this.loadConversations();
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.sending.set(false);
      },
    });
  }

  private scrollThread(): void {
    requestAnimationFrame(() => {
      const el = this.thread?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
