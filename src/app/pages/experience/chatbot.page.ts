import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ICONS } from '../../core/navigation';
import { AuthService } from '../../core/services/auth.service';
import { CatalogStore } from '../../core/services/catalog-store.service';
import { ExperienceService } from '../../core/services/experience.service';
import { UiIconComponent } from '../../shared/ui/icon.component';

interface Message {
  id: number;
  text: string;
  from: 'user' | 'bot';
  time: string;
}

interface QuickAction {
  label: string;
  icon: string;
}

const SUGGESTIONS = [
  '¿Qué prendas tienen en stock disponible?',
  '¿Cuáles son las sucursales disponibles?',
  'Estado de mis pedidos y compras',
  'Promociones y descuentos vigentes',
  'Cambio de talla o devolución',
];

const BOT_RESPONSES: Record<string, string> = {
  pedido:
    'Puedes revisar el estado de tus compras en la sección "Mis compras". Las reservas O2O se retiran directamente en sucursal presentando tu código.',
  devoluci:
    'Puedes solicitar cambios de talla o prenda dentro de los 30 días posteriores a la compra desde "Mis compras" o en cualquiera de nuestras sucursales presentando tu comprobante.',
  talla:
    'Cada prenda incluye su disponibilidad por talla (XS a XXL) en tiempo real. Si la talla no te queda en el probador, el cajero puede cambiarla al instante.',
  'envío':
    'El envío estándar a domicilio tiene un costo de Bs. 25.00 (gratis en compras mayores a Bs. 350.00). El retiro y reserva en sucursal es 100% gratuito.',
  oferta:
    'Contamos con descuentos directos en el catálogo y promociones de temporada de hasta 30% en prendas seleccionadas.',
  'ar':
    'El Probador Virtual 3D y Espejo AR te permite visualizar cómo luce la prenda en tiempo real. Ingresa a cualquier producto y pulsa "Probador Virtual".',
  default:
    '¡Hola! Soy Aria, tu asistente virtual con IA de FashionStore 👋 Puedo consultar stock real en Bolivianos (Bs.), tus pedidos, reservas en tienda, tallas y sucursales. ¿En qué te ayudo?',
};

/**
 * CU19 — Asistente virtual de la tienda (vista del cliente, web).
 * Conectado al motor de contexto e IA del backend (`/api/v1/chatbot`) con respaldo local multitenant.
 */
@Component({
  selector: 'app-chatbot-page',
  imports: [CommonModule, FormsModule, UiIconComponent],
  templateUrl: './chatbot.page.html',
  styleUrl: './chatbot.page.scss',
})
export class ChatbotPage {
  @ViewChild('endRef') endRef?: ElementRef<HTMLDivElement>;

  private readonly experience = inject(ExperienceService);
  private readonly auth = inject(AuthService);
  private readonly store = inject(CatalogStore);

  readonly icons = ICONS;
  readonly suggestions = SUGGESTIONS;
  readonly quickActions: QuickAction[] = [
    { label: '¿Qué prendas tienen en stock disponible?', icon: ICONS.catalog },
    { label: 'Estado de mis pedidos y compras', icon: ICONS.purchases },
    { label: 'Sucursales disponibles', icon: ICONS.store },
    { label: 'Promociones y descuentos vigentes', icon: ICONS.tag },
    { label: 'Cambio de talla o devolución', icon: ICONS.box },
    { label: '¿Cómo funciona el Probador Virtual?', icon: ICONS.sparkles },
  ];

  readonly messages = signal<Message[]>([
    { id: 1, text: BOT_RESPONSES['default'], from: 'bot', time: 'Ahora' },
  ]);
  readonly typing = signal(false);

  input = '';
  private nextId = 2;
  private conversationId: number | null = null;

  send(text?: string): void {
    const value = (text ?? this.input).trim();
    if (!value || this.typing()) return;

    this.messages.update((list) => [
      ...list,
      { id: this.nextId++, text: value, from: 'user', time: this.now() },
    ]);
    this.input = '';
    this.typing.set(true);
    this.scrollDown();

    if (this.auth.hasToken()) {
      this.sendViaBackend(value);
      return;
    }

    setTimeout(() => {
      this.pushBotReply(this.reply(value));
    }, 500);
  }

  private sendViaBackend(content: string): void {
    const dispatchMessage = (convId: number) => {
      this.experience.sendMessage(convId, { content }).subscribe({
        next: (msg) => this.pushBotReply(msg.content || this.reply(content)),
        error: () => this.pushBotReply(this.reply(content)),
      });
    };

    if (this.conversationId !== null) {
      dispatchMessage(this.conversationId);
      return;
    }

    this.experience.createConversation({ title: 'Asistente Virtual Web' }).subscribe({
      next: (conv) => {
        this.conversationId = conv.id;
        dispatchMessage(conv.id);
      },
      error: () => this.pushBotReply(this.reply(content)),
    });
  }

  private pushBotReply(text: string): void {
    this.messages.update((list) => [
      ...list,
      { id: this.nextId++, text, from: 'bot', time: this.now() },
    ]);
    this.typing.set(false);
    this.scrollDown();
  }

  private reply(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('sucursal') || lower.includes('tienda') || lower.includes('horario') || lower.includes('direcci')) {
      const firstProd = this.store.products()[0];
      const branches = firstProd ? Object.keys(firstProd.stock || {}) : [];
      if (branches.length > 0) {
        const names = branches.map((b: string) => `Sucursal ${b}`).join(', ');
        return `Nuestras sucursales habilitadas son: ${names}. Horario de atención: Lunes a Sábado de 09:30 a 21:00 hrs.`;
      }
      return 'Contamos con sucursales en Centro, Norte y Sur. Horario de atención: Lunes a Sábado de 09:30 a 21:00 hrs.';
    }
    if (lower.includes('stock') || lower.includes('prenda') || lower.includes('disponib') || lower.includes('precio') || lower.includes('catalogo')) {
      const topProducts = this.store.products().slice(0, 3);
      if (topProducts.length > 0) {
        const summary = topProducts
          .map((p) => `${p.name} (Bs. ${p.price.toFixed(2)}, tallas: ${p.sizes.join(', ')})`)
          .join('; ');
        return `Algunas de nuestras prendas destacadas con stock disponible son: ${summary}. Puedes reservarlas para probar en tienda o comprarlas en línea.`;
      }
    }
    const key = Object.keys(BOT_RESPONSES).find(
      (candidate) => candidate !== 'default' && lower.includes(candidate)
    );
    return (
      (key ? BOT_RESPONSES[key] : undefined) ??
      'Puedo ayudarte con disponibilidad de prendas en Bolivianos (Bs.), estado de tus pedidos, reservas de probador en sucursal y cambios de talla.'
    );
  }

  private now(): string {
    return new Date().toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private scrollDown(): void {
    setTimeout(
      () => this.endRef?.nativeElement.scrollIntoView({ behavior: 'smooth' }),
      60
    );
  }
}
