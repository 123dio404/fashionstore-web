import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  tenants = signal<TenantResponse[]>([]);
  loading = signal(false);
  showCreate = signal(false);
  creating = signal(false);

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
