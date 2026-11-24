import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { StatusBadge } from '../../shared/status-badge';
import { Pager } from '../../shared/pager';
import { BookingActions } from '../provider/booking-actions';
import { Booking, PageMeta } from '../../core/models';

@Component({
  selector: 'app-admin-bookings',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadge, Pager, BookingActions],
  template: `
    <div class="stack-lg">
      <h1>All bookings</h1>
      <div class="card pad form-inline">
        <div class="field grow">
          <label for="q">Search</label>
          <input id="q" type="search" placeholder="Booking ID, service, customer or provider name" #q (keyup.enter)="apply(q.value, status.value)" />
        </div>
        <div class="field">
          <label for="status">Status</label>
          <select id="status" #status (change)="apply(q.value, status.value)">
            <option value="">All</option>
            <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option><option value="rejected">Rejected</option><option value="no_show">No-show</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" (click)="apply(q.value, status.value)">Search</button>
      </div>
      <div class="card table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Customer</th><th>Provider</th><th>Service</th><th>Slot</th><th>Amount</th><th>Status</th><th class="right">Change status</th></tr></thead>
          <tbody>
            @for (b of items(); track b.id) {
              <tr>
                <td><a [routerLink]="['/bookings', b.id]">{{ b.code }}</a></td>
                <td>{{ b.customer?.name }}</td>
                <td>{{ b.provider?.businessName }}</td>
                <td>{{ b.serviceTitle }}</td>
                <td>{{ b.startTime | date }}</td>
                <td>{{ b.price | currency: 'INR' : 'symbol' : '1.0-0' }}</td>
                <td><app-status-badge [status]="b.status" /></td>
                <td class="right"><app-booking-actions [booking]="b" (changed)="load(meta()?.page ?? 1)" /></td>
              </tr>
            } @empty { <tr><td colspan="8" class="muted">No bookings found.</td></tr> }
          </tbody>
        </table>
      </div>
      <app-pager [meta]="meta()" (go)="load($event)" />
    </div>
  `,
})
export class AdminBookings implements OnInit {
  private data = inject(DataService);
  protected items = signal<Booking[]>([]);
  protected meta = signal<PageMeta | null>(null);
  private filters = { q: '', status: '' };

  ngOnInit() { this.load(1); }

  apply(q: string, status: string) { this.filters = { q, status }; this.load(1); }

  load(page: number) {
    this.data.adminBookings({ ...this.filters, page }).subscribe((r) => { this.items.set(r.items); this.meta.set(r.meta); });
  }
}
