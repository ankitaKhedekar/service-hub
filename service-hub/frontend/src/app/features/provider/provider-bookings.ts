import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { errorMessage } from '../../core/api.service';
import { StatusBadge } from '../../shared/status-badge';
import { Pager } from '../../shared/pager';
import { BookingActions } from './booking-actions';
import { Booking, PageMeta } from '../../core/models';

@Component({
  selector: 'app-provider-bookings',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge, Pager, BookingActions],
  template: `
    <div class="stack-lg">
      <h1>Bookings</h1>
      <div class="tabs" role="tablist">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" class="tab" [class.active]="tab() === t.key" [attr.aria-selected]="tab() === t.key" (click)="select(t.key)">{{ t.label }}</button>
        }
      </div>
      @if (error()) { <p class="alert alert-error">{{ error() }}</p> }
      <div class="card table-wrap">
        <table>
          <thead><tr><th>Booking</th><th>Customer</th><th>Service</th><th>Slot</th><th>Amount</th><th>Status</th><th class="right">Action</th></tr></thead>
          <tbody>
            @for (b of items(); track b.id) {
              <tr>
                <td><a [routerLink]="['/bookings', b.id]">{{ b.code }}</a></td>
                <td>{{ b.customer?.name }}<div class="muted small">{{ b.customer?.phone }}</div></td>
                <td>{{ b.serviceTitle }}</td>
                <td>{{ b.startTime | date }}</td>
                <td>{{ b.price | currency: 'INR' : 'symbol' : '1.0-0' }}</td>
                <td><app-status-badge [status]="b.status" /></td>
                <td class="right"><app-booking-actions [booking]="b" (changed)="load(meta()?.page ?? 1)" /></td>
              </tr>
            } @empty { <tr><td colspan="7" class="muted">{{ loading() ? 'Loading…' : 'No bookings here.' }}</td></tr> }
          </tbody>
        </table>
      </div>
      <app-pager [meta]="meta()" (go)="load($event)" />
    </div>
  `,
})
export class ProviderBookings implements OnInit {
  private data = inject(DataService);
  protected tabs = [
    { key: 'pending', label: 'Requests' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: '', label: 'All' },
  ];
  protected tab = signal('pending');
  protected items = signal<Booking[]>([]);
  protected meta = signal<PageMeta | null>(null);
  protected loading = signal(true);
  protected error = signal('');

  ngOnInit() { this.load(1); }

  select(key: string) { this.tab.set(key); this.load(1); }

  load(page: number) {
    this.loading.set(true);
    this.data.providerBookings({ status: this.tab(), page }).subscribe({
      next: (r) => { this.items.set(r.items); this.meta.set(r.meta); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
