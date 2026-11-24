import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { StatusBadge } from '../../shared/status-badge';
import { Pager } from '../../shared/pager';
import { PageMeta } from '../../core/models';

interface AdminService { id: string; title: string; price: number; durationMinutes: number; isActive: boolean; category: string; provider: string; }

@Component({
  selector: 'app-admin-services',
  imports: [CurrencyPipe, StatusBadge, Pager],
  template: `
    <div class="stack-lg">
      <div class="row-between">
        <h1>Services</h1>
        <div class="field inline">
          <label for="q" class="sr-only">Search services</label>
          <input id="q" type="search" placeholder="Search by title" #q (keyup.enter)="search(q.value)" />
          <button type="button" class="btn btn-outline btn-sm" (click)="search(q.value)">Search</button>
        </div>
      </div>
      <div class="card table-wrap">
        <table>
          <thead><tr><th>Service</th><th>Provider</th><th>Category</th><th>Price</th><th>Duration</th><th>Status</th><th class="right">Action</th></tr></thead>
          <tbody>
            @for (s of items(); track s.id) {
              <tr>
                <td><strong>{{ s.title }}</strong></td>
                <td>{{ s.provider }}</td>
                <td>{{ s.category }}</td>
                <td>{{ s.price | currency: 'INR' : 'symbol' : '1.0-0' }}</td>
                <td>{{ s.durationMinutes }} min</td>
                <td><app-status-badge [status]="s.isActive ? 'active' : 'inactive'" /></td>
                <td class="right"><button type="button" class="btn btn-outline btn-sm" (click)="toggle(s)">{{ s.isActive ? 'Hide' : 'Show' }}</button></td>
              </tr>
            } @empty { <tr><td colspan="7" class="muted">No services found.</td></tr> }
          </tbody>
        </table>
      </div>
      <app-pager [meta]="meta()" (go)="load($event)" />
    </div>
  `,
})
export class AdminServices implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);
  protected items = signal<AdminService[]>([]);
  protected meta = signal<PageMeta | null>(null);
  private q = '';

  ngOnInit() { this.load(1); }

  search(q: string) { this.q = q; this.load(1); }

  load(page: number) {
    this.data.adminServices({ q: this.q, page, }).subscribe((r) => { this.items.set(r.items); this.meta.set(r.meta); });
  }

  toggle(s: AdminService) {
    this.data.setServiceActive(s.id, !s.isActive).subscribe({
      next: () => this.items.update((list) => list.map((x) => (x.id === s.id ? { ...x, isActive: !s.isActive } : x))),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
