import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BranchesService } from '../../core/services/branches.service';
import { BranchCreate, BranchResponse, CityCreate, CityResponse } from '../../models';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { UiDrawerComponent } from '../../shared/ui/drawer.component';
import { TabItem, UiTabsComponent } from '../../shared/ui/tabs.component';

const EMPTY_BRANCH: BranchCreate = { city_id: 0, name: '', address: '', is_active: true };

/** CU04 — Gestionar sucursales y ciudades: pestañas, tablas y drawers de alta/edición. */
@Component({
  selector: 'app-branches-page',
  imports: [CommonModule, FormsModule, UiDrawerComponent, UiTabsComponent],
  templateUrl: './branches.page.html'
})
export class BranchesPage {
  private readonly service = inject(BranchesService);
  private readonly confirm = inject(ConfirmService);

  readonly cities = signal<CityResponse[]>([]);
  readonly branches = signal<BranchResponse[]>([]);
  readonly activeTab = signal<'branches' | 'cities'>('branches');
  readonly branchDrawer = signal(false);
  readonly cityDrawer = signal(false);
  readonly editingBranch = signal<BranchResponse | null>(null);
  readonly editingCity = signal<CityResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  branchForm: BranchCreate = { ...EMPTY_BRANCH };
  cityNameValue = '';

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'branches', label: 'Sucursales', count: this.branches().length },
    { id: 'cities', label: 'Ciudades', count: this.cities().length }
  ]);

  constructor() {
    this.loadCities();
    this.loadBranches();
  }

  onTab(id: string): void {
    this.activeTab.set(id as 'branches' | 'cities');
    this.message.set(null);
    this.error.set(null);
  }

  cityName(id: number): string {
    return this.cities().find((city) => city.id === id)?.name ?? `#${id}`;
  }

  branchesIn(cityId: number): number {
    return this.branches().filter((branch) => branch.city_id === cityId).length;
  }

  initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  loadCities(): void {
    this.service.listCities().subscribe({
      next: (data) => this.cities.set(data),
      error: (err: Error) => this.fail(err)
    });
  }

  loadBranches(): void {
    this.service.list().subscribe({
      next: (data) => this.branches.set(data),
      error: (err: Error) => this.fail(err)
    });
  }

  // --- Sucursales ---
  openBranchCreate(): void {
    this.editingBranch.set(null);
    this.branchForm = { ...EMPTY_BRANCH };
    this.branchDrawer.set(true);
  }

  openBranchEdit(branch: BranchResponse): void {
    this.editingBranch.set(branch);
    this.branchForm = {
      city_id: branch.city_id,
      name: branch.name,
      address: branch.address,
      is_active: branch.is_active
    };
    this.branchDrawer.set(true);
  }

  saveBranch(): void {
    if (!this.branchForm.city_id || !this.branchForm.name.trim() || !this.branchForm.address.trim()) {
      this.fail(new Error('Ciudad, nombre y dirección son obligatorios.'));
      return;
    }

    const current = this.editingBranch();
    if (current) {
      this.service.update(current.id, this.branchForm).subscribe({
        next: () => {
          this.message.set('Sucursal actualizada.');
          this.error.set(null);
          this.branchDrawer.set(false);
          this.loadBranches();
        },
        error: (err: Error) => this.fail(err)
      });
      return;
    }

    this.service.create(this.branchForm).subscribe({
      next: () => {
        this.message.set('Sucursal creada.');
        this.error.set(null);
        this.branchDrawer.set(false);
        this.loadBranches();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  toggleBranch(branch: BranchResponse): void {
    this.service.update(branch.id, { is_active: !branch.is_active }).subscribe({
      next: () => {
        this.message.set(branch.is_active ? 'Sucursal desactivada.' : 'Sucursal activada.');
        this.loadBranches();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  removeBranch(branch: BranchResponse): void {
    void this.confirm
      .ask({
        title: 'Eliminar sucursal',
        message: `¿Eliminar "${branch.name}"? Si tiene stock o ventas asociadas el sistema lo impedirá.`,
        confirmLabel: 'Sí, eliminar',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.service.remove(branch.id).subscribe({
          next: () => {
            this.message.set('Sucursal eliminada.');
            this.loadBranches();
          },
          error: (err: Error) => this.fail(err)
        });
      });
  }

  // --- Ciudades ---
  openCityCreate(): void {
    this.editingCity.set(null);
    this.cityNameValue = '';
    this.cityDrawer.set(true);
  }

  openCityEdit(city: CityResponse): void {
    this.editingCity.set(city);
    this.cityNameValue = city.name;
    this.cityDrawer.set(true);
  }

  saveCity(): void {
    const name = this.cityNameValue.trim();
    if (!name) {
      this.fail(new Error('El nombre de la ciudad es obligatorio.'));
      return;
    }

    const payload: CityCreate = { name };
    const current = this.editingCity();
    if (current) {
      this.service.updateCity(current.id, payload).subscribe({
        next: () => {
          this.message.set('Ciudad actualizada.');
          this.error.set(null);
          this.cityDrawer.set(false);
          this.loadCities();
        },
        error: (err: Error) => this.fail(err)
      });
      return;
    }

    this.service.createCity(payload).subscribe({
      next: () => {
        this.message.set('Ciudad creada.');
        this.error.set(null);
        this.cityDrawer.set(false);
        this.loadCities();
      },
      error: (err: Error) => this.fail(err)
    });
  }

  removeCity(city: CityResponse): void {
    void this.confirm
      .ask({
        title: 'Eliminar ciudad',
        message: `¿Eliminar "${city.name}"? Si tiene sucursales asociadas el sistema lo impedirá.`,
        confirmLabel: 'Sí, eliminar',
        danger: true
      })
      .then((confirmed) => {
        if (!confirmed) return;
        this.service.removeCity(city.id).subscribe({
          next: () => {
            this.message.set('Ciudad eliminada.');
            this.loadCities();
          },
          error: (err: Error) => this.fail(err)
        });
      });
  }

  private fail(err: Error): void {
    this.error.set(err.message);
    this.message.set(null);
  }
}
