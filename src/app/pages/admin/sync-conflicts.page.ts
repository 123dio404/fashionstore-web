import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SaleResponse } from '../../models';

@Component({
  selector: 'app-sync-conflicts-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-conflicts.page.html',
  styleUrls: ['./sync-conflicts.page.scss']
})
export class SyncConflictsPage implements OnInit {
  private http = inject(HttpClient);
  conflicts = signal<SaleResponse[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.http.get<SaleResponse[]>(`${environment.apiUrl}/sync/conflicts`).subscribe({
      next: (c) => { this.conflicts.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  resolve(saleId: number) {
    this.http.post<SaleResponse>(`${environment.apiUrl}/sync/conflicts/${saleId}/resolve`, {}).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.detail || 'Error al resolver')
    });
  }
}
