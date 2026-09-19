import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ExperienceService } from '../../core/services/experience.service';
import { ChatConversationResponse, ChatMessageResponse } from '../../models';

@Component({
  selector: 'app-chatbot-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Asistente FashionStore</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <div class="card">
      <div class="row">
        <input placeholder="Título de la conversación" [(ngModel)]="newTitle" />
        <button class="btn-primary" (click)="create()">Nueva conversación</button>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Conversaciones</h3>
        @if (conversations().length === 0) {
          <p class="muted">Aún no tienes conversaciones.</p>
        }
        @for (conversation of conversations(); track conversation.id) {
          <div class="row" style="margin-bottom: 0.5rem">
            <a (click)="open(conversation.id)" style="cursor: pointer">
              #{{ conversation.id }} · {{ conversation.title || 'Sin título' }}
            </a>
            <span class="spacer"></span>
            <span class="badge">{{ conversation.messages.length }}</span>
          </div>
        }
      </div>

      <div class="card">
        <h3>Mensajes</h3>
        @if (!active()) {
          <p class="muted">Selecciona o crea una conversación.</p>
        } @else {
          <div style="max-height: 22rem; overflow-y: auto; margin-bottom: 0.75rem">
            @for (message of messages(); track message.id) {
              <div
                class="card"
                style="margin-bottom: 0.5rem; background: #faf5ff; padding: 0.6rem 0.8rem"
              >
                <strong>{{ message.role }}</strong>
                <p style="margin: 0.25rem 0">{{ message.content }}</p>
              </div>
            }
          </div>
          <div class="row">
            <input placeholder="Escribe tu mensaje" [(ngModel)]="draft" />
            <button class="btn-primary" [disabled]="!draft.trim() || sending()" (click)="send()">
              {{ sending() ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class ChatbotPage {
  private readonly experience = inject(ExperienceService);

  readonly conversations = signal<ChatConversationResponse[]>([]);
  readonly messages = signal<ChatMessageResponse[]>([]);
  readonly active = signal<ChatConversationResponse | null>(null);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);

  newTitle = '';
  draft = '';

  constructor() {
    this.loadConversations();
  }

  loadConversations(): void {
    this.experience.listConversations().subscribe({
      next: (data) => this.conversations.set(data),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  create(): void {
    this.experience.createConversation({ title: this.newTitle || 'Asistente FashionStore' }).subscribe({
      next: (conversation) => {
        this.newTitle = '';
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
