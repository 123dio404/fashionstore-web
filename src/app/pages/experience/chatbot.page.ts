import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ExperienceService } from '../../core/services/experience.service';
import { ChatConversationResponse, ChatMessageResponse } from '../../models';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';
import { UiEmptyComponent } from '../../shared/ui/empty-state.component';

/** CU19 — Asistente conversacional: lista de conversaciones, hilo de mensajes y sugerencias. */
@Component({
  selector: 'app-chatbot-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent, UiEmptyComponent],
  templateUrl: './chatbot.page.html',
  styleUrl: './chatbot.page.scss'
})
export class ChatbotPage {
  private readonly experience = inject(ExperienceService);

  readonly suggestions = [
    '¿Cómo hago seguimiento a mi pedido?',
    '¿Puedo cambiar la talla de mi compra?',
    '¿Cuánto tarda una reserva en tienda?',
    '¿Qué métodos de pago aceptan?'
  ];

  readonly conversations = signal<ChatConversationResponse[]>([]);
  readonly messages = signal<ChatMessageResponse[]>([]);
  readonly active = signal<ChatConversationResponse | null>(null);
  readonly sending = signal(false);
  readonly createDrawer = signal(false);
  readonly error = signal<string | null>(null);

  newTitle = '';
  draft = '';

  constructor() {
    this.loadConversations();
  }

  isUser(message: ChatMessageResponse): boolean {
    return message.role?.toLowerCase() === 'user' || message.role?.toLowerCase() === 'cliente';
  }

  useSuggestion(suggestion: string): void {
    this.draft = suggestion;
  }

  loadConversations(): void {
    this.experience.listConversations().subscribe({
      next: (data) => this.conversations.set(data),
      error: (err: Error) => this.error.set(err.message)
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
        },
        error: (err: Error) => this.error.set(err.message)
      });
  }

  open(id: number): void {
    this.experience.getConversation(id).subscribe({
      next: (conversation) => {
        this.active.set(conversation);
        this.messages.set(conversation.messages);
      },
      error: (err: Error) => this.error.set(err.message)
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
      }
    });
  }
}
