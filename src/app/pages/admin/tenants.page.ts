import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../core/services/notifications.service';
import { SaasService } from '../../core/services/saas.service';
import { TenantCreateRequest, TenantResponse } from '../../models';

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenants.page.html',
  styleUrls: ['./tenants.page.scss']
})
export class TenantsPage implements OnInit {
  private saas = inject(SaasService);
  private notifications = inject(NotificationsService);

  tenants = signal<TenantResponse[]>([]);
  loading = signal(false);
  showCreate = signal(false);
  creating = signal(false);

  showBroadcast = signal(false);
  broadcasting = signal(false);
  broadcastSuccess = signal<string | null>(null);
  broadcastTargetTenantId: number | null = null; // null = todos
  broadcastTitle = 'Recordatorio de Pago de Suscripción';
  broadcastMessage = 'Estimado administrador, le recordamos que la facturación de su plan SaaS está próxima a vencer. Por favor verifique su estado de cuenta en el módulo de Suscripción.';
  broadcastType = 'billing_reminder';

  form: TenantCreateRequest = {
    name: '',
    slug: '',
    tax_id: null,
    plan_name: 'Básico',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  };

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.saas.getTenants().subscribe({
      next: (t) => { this.tenants.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  toggleCreate() {
    this.showCreate.update(v => !v);
  }

  openBroadcastModal() {
    this.showBroadcast.set(true);
    this.broadcastSuccess.set(null);
  }

  sendBroadcast() {
    if (!this.broadcastTitle || !this.broadcastMessage) {
      alert('Ingresa título y mensaje');
      return;
    }
    this.broadcasting.set(true);
    const targetIds = this.broadcastTargetTenantId ? [Number(this.broadcastTargetTenantId)] : undefined;

    this.notifications.broadcastToTenants({
      tenant_ids: targetIds,
      title: this.broadcastTitle,
      message: this.broadcastMessage,
      type: this.broadcastType,
      link: '/admin/subscription'
    }).subscribe({
      next: (res) => {
        this.broadcasting.set(false);
        this.broadcastSuccess.set(res.detail || 'Notificación push enviada exitosamente.');
        setTimeout(() => this.showBroadcast.set(false), 2500);
      },
      error: (err) => {
        this.broadcasting.set(false);
        alert(err?.error?.detail || 'Error al enviar notificación');
      }
    });
  }

  create() {
    if (!this.form.name || !this.form.slug || !this.form.admin_email || !this.form.admin_password) {
      alert('Completa los campos obligatorios');
      return;
    }
    this.creating.set(true);
    this.saas.createTenant(this.form).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreate.set(false);
        this.form = { name: '', slug: '', tax_id: null, plan_name: 'Básico', admin_name: '', admin_email: '', admin_password: '' };
        this.load();
      },
      error: (err) => {
        this.creating.set(false);
        alert(err?.error?.detail || 'Error al crear tenant');
      }
    });
  }
}
