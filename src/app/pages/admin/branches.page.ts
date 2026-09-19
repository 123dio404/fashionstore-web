import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BranchesService } from '../../core/services/branches.service';
import { BranchCreate, BranchResponse, CityResponse } from '../../models';

@Component({
  selector: 'app-branches-page',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Sucursales y ciudades</h2>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success">{{ message() }}</p>
    }

    <div class="card">
      <h3>Ciudades</h3>
      <div class="row">
        <input placeholder="Nueva ciudad" [(ngModel)]="newCity" style="max-width: 18rem" />
        <button class="btn-primary" (click)="addCity()">Agregar</button>
      </div>
      <table style="margin-top: 1rem">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (city of cities(); track city.id) {
            <tr>
              <td>{{ city.id }}</td>
              <td>{{ city.name }}</td>
              <td><button class="btn-danger" (click)="removeCity(city)">Eliminar</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Sucursales</h3>
      <div class="grid-2">
        <div>
          <label for="city">Ciudad</label>
          <select id="city" [(ngModel)]="form.city_id">
            <option [ngValue]="0">Selecciona una ciudad</option>
            @for (city of cities(); track city.id) {
              <option [ngValue]="city.id">{{ city.name }}</option>
            }
          </select>
        </div>
        <div>
          <label for="name">Nombre</label>
          <input id="name" [(ngModel)]="form.name" />
        </div>
        <div>
          <label for="address">Dirección</label>
          <input id="address" [(ngModel)]="form.address" />
        </div>
      </div>
      <br />
      <button class="btn-primary" (click)="addBranch()">Crear sucursal</button>

      <table style="margin-top: 1rem">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Ciudad</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (branch of branches(); track branch.id) {
            <tr>
              <td>{{ branch.id }}</td>
              <td>{{ branch.name }}</td>
              <td>{{ cityName(branch.city_id) }}</td>
              <td>{{ branch.address }}</td>
              <td>
                <span class="badge" [class.ok]="branch.is_active">
                  {{ branch.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <button class="btn" (click)="toggleBranch(branch)">
                  {{ branch.is_active ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="btn-danger" (click)="removeBranch(branch)">Eliminar</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class BranchesPage {
  private readonly service = inject(BranchesService);

  readonly cities = signal<CityResponse[]>([]);
  readonly branches = signal<BranchResponse[]>([]);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  newCity = '';
  form: BranchCreate = { city_id: 0, name: '', address: '', is_active: true };

  constructor() {
    this.loadCities();
    this.loadBranches();
  }

  cityName(id: number): string {
    return this.cities().find((c) => c.id === id)?.name ?? `#${id}`;
  }

  loadCities(): void {
    this.service.listCities().subscribe({
      next: (data) => this.cities.set(data),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  loadBranches(): void {
    this.service.list().subscribe({
      next: (data) => this.branches.set(data),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  addCity(): void {
    if (!this.newCity.trim()) return;
    this.service.createCity({ name: this.newCity.trim() }).subscribe({
      next: () => {
        this.newCity = '';
        this.message.set('Ciudad creada.');
        this.loadCities();
      },
      error: (err: Error) => this.error.set(err.message)
    });
  }

  removeCity(city: CityResponse): void {
    this.service.removeCity(city.id).subscribe({
      next: () => this.loadCities(),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  addBranch(): void {
    if (!this.form.city_id || !this.form.name.trim() || !this.form.address.trim()) {
      this.error.set('Ciudad, nombre y dirección son obligatorios.');
      return;
    }
    this.service.create(this.form).subscribe({
      next: () => {
        this.message.set('Sucursal creada.');
        this.form = { city_id: 0, name: '', address: '', is_active: true };
        this.loadBranches();
      },
      error: (err: Error) => this.error.set(err.message)
    });
  }

  toggleBranch(branch: BranchResponse): void {
    this.service.update(branch.id, { is_active: !branch.is_active }).subscribe({
      next: () => this.loadBranches(),
      error: (err: Error) => this.error.set(err.message)
    });
  }

  removeBranch(branch: BranchResponse): void {
    this.service.remove(branch.id).subscribe({
      next: () => this.loadBranches(),
      error: (err: Error) => this.error.set(err.message)
    });
  }
}
