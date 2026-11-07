import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NotificationsService } from '../../core/services/notifications.service';
import { SaasService } from '../../core/services/saas.service';
import { PlanCreateRequest, PlanResponse } from '../../models';
import { ConfirmService } from '../../shared/ui/confirm.service';

/**
 * CU-02 — Administración de planes SaaS (solo Superadministrador).
 * Permite crear, editar, activar/desactivar y eliminar planes comerciales.
 */
@Component({
  selector: 'app-plans-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss']
})
export class PlansPage implements OnInit {
  private readonly saas = inject(SaasService);
  private readonly notifs = inject(NotificationsService);
  private readonly confirm = inject(ConfirmService);

  readonly plans = signal<PlanResponse[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  editingId: number | null = null;

  form: PlanCreateRequest = this.emptyForm();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.saas.getPlans(true).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notifs.error(err?.error?.detail || 'No se pudieron cargar los planes.');
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  openEdit(plan: PlanResponse): void {
    this.editingId = plan.id;
    this.form = {
      name: plan.name,
      max_branches: plan.max_branches,
      has_ai_reports: plan.has_ai_reports,
      monthly_price: Number(plan.monthly_price),
      is_active: plan.is_active
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId = null;
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.notifs.warning('El nombre del plan es obligatorio.');
      return;
    }

    this.saving.set(true);
    const payload: PlanCreateRequest = {
      ...this.form,
      name: this.form.name.trim(),
      max_branches: Number(this.form.max_branches),
      monthly_price: Number(this.form.monthly_price)
    };

    const request$ = this.editingId
      ? this.saas.updatePlan(this.editingId, payload)
      : this.saas.createPlan(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifs.success(
          this.editingId ? 'Plan actualizado.' : 'Plan creado correctamente.'
        );
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.notifs.error(err?.error?.detail || 'No se pudo guardar el plan.');
      }
    });
  }

  toggleActive(plan: PlanResponse): void {
    this.saas.updatePlan(plan.id, { is_active: !plan.is_active }).subscribe({
      next: () => {
        this.notifs.success(
          `Plan ${plan.name} ${plan.is_active ? 'desactivado' : 'activado'}.`
        );
        this.load();
      },
      error: (err) =>
        this.notifs.error(err?.error?.detail || 'No se pudo actualizar el plan.')
    });
  }

  async remove(plan: PlanResponse): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Eliminar plan',
      message: `¿Eliminar el plan "${plan.name}"? Solo es posible si no tiene suscripciones.`,
      confirmLabel: 'Eliminar',
      danger: true
    });
    if (!confirmed) return;

    this.saas.deletePlan(plan.id).subscribe({
      next: () => {
        this.notifs.success('Plan eliminado.');
        this.load();
      },
      error: (err) =>
        this.notifs.error(
          err?.error?.detail || 'No se pudo eliminar el plan.'
        )
    });
  }

  private emptyForm(): PlanCreateRequest {
    return {
      name: '',
      max_branches: 2,
      has_ai_reports: false,
      monthly_price: 0,
      is_active: true
    };
  }
}
