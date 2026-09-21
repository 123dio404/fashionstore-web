import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ICONS } from '../../core/navigation';
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
  '¿Cuándo llega mi pedido?',
  'Política de devoluciones',
  'Cambio de talla',
  '¿Tienen envío gratis?',
  'Sucursales disponibles',
];

const BOT_RESPONSES: Record<string, string> = {
  pedido:
    'Puedes seguir tu pedido en la sección "Mis compras". Los envíos a domicilio tardan 3–5 días hábiles. ¿Necesitas el número de seguimiento?',
  devoluci:
    'Aceptamos devoluciones hasta 30 días después de la compra. El producto debe estar sin uso y con etiquetas. Te enviamos un rótulo de devolución gratuito.',
  talla:
    'Puedes consultar nuestra guía de tallas en cada producto. Si tomaste una talla incorrecta, hacemos el cambio sin costo adicional.',
  'envío':
    'El envío es gratuito en compras mayores a $100. De lo contrario el costo es $9.99, con entrega en 3–5 días hábiles. El retiro en tienda es sin costo en 24 hrs.',
  sucursal:
    'Tenemos 3 sucursales: Centro (Av. Corrientes 1450), Norte (Av. del Libertador 3200) y Sur (Av. Rivadavia 8900). Horario: Lun–Sáb 10–21 hs.',
  oferta:
    'Usa el código FASHION10 en el carrito para obtener 10% de descuento. Además hay promociones activas de hasta 40%.',
  'ar':
    'El Probador Virtual te permite ver cómo te queda una prenda. Abre cualquier producto y toca "Probar en Probador Virtual" en el detalle.',
  default:
    'Hola! Soy Aria, tu asistente de FashionStore 👋 Puedo ayudarte con pedidos, envíos, tallas y más. ¿En qué te ayudo?',
};

/**
 * CU19 — Asistente virtual de la tienda (vista del cliente, web).
 * Reproduce `design/figma-make/src/web/screens/ChatbotPage.tsx`.
 */
@Component({
  selector: 'app-chatbot-page',
  imports: [CommonModule, FormsModule, UiIconComponent],
  templateUrl: './chatbot.page.html',
  styleUrl: './chatbot.page.scss',
})
export class ChatbotPage {
  @ViewChild('endRef') endRef?: ElementRef<HTMLDivElement>;

  readonly icons = ICONS;
  readonly suggestions = SUGGESTIONS;
  readonly quickActions: QuickAction[] = [
    { label: 'Estado de mi pedido', icon: ICONS.purchases },
    { label: 'Política de devoluciones', icon: ICONS.box },
    { label: 'Guía de tallas', icon: ICONS.catalog },
    { label: 'Horarios de tiendas', icon: ICONS.store },
    { label: 'Ofertas del día', icon: ICONS.tag },
    { label: 'Hablar con un agente', icon: ICONS.users },
  ];

  readonly messages = signal<Message[]>([
    { id: 1, text: BOT_RESPONSES['default'], from: 'bot', time: 'Ahora' },
  ]);
  readonly typing = signal(false);

  input = '';
  private nextId = 2;

  send(text?: string): void {
    const value = (text ?? this.input).trim();
    if (!value) return;

    this.messages.update((list) => [
      ...list,
      { id: this.nextId++, text: value, from: 'user', time: this.now() },
    ]);
    this.input = '';
    this.typing.set(true);
    this.scrollDown();

    setTimeout(() => {
      this.messages.update((list) => [
        ...list,
        { id: this.nextId++, text: this.reply(value), from: 'bot', time: this.now() },
      ]);
      this.typing.set(false);
      this.scrollDown();
    }, 800);
  }

  private reply(text: string): string {
    const lower = text.toLowerCase();
    const key = Object.keys(BOT_RESPONSES).find(
      (candidate) => candidate !== 'default' && lower.includes(candidate)
    );
    return (
      (key ? BOT_RESPONSES[key] : undefined) ??
      '¡Gracias por tu consulta! Un agente especializado te contactará en breve.'
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
