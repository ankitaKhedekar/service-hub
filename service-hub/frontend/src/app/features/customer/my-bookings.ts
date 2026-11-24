import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatusBadge } from '../../shared/status-badge';
import { Pager } from '../../shared/pager';
import { DataService } from '../../core/data.service';
import { errorMessage } from '../../core/api.service';
import { Booking, PageMeta } from '../../core/models';

type Tab = 'upcoming' | 'past' | 'cancelled';

@Component({
  selector: 'app-my-bookings',
  imports: [StatusBadge, Pager, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="container page stack-lg">
      <h1>My bookings</h1>
      <div class="tabs" role="tablist" aria-label="Booking filter">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" class="tab" [class.active]="tab() === t.key" [attr.aria-selected]="tab() === t.key" (click)="select(t.key)">{{ t.label }}</button>
        }
      </div>
      @if (error()) { <p class="alert alert-error">{{ error() }}</p> }
      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else {
        <div class="stack">
          @for (b of bookings(); track b.id) {
            <a class="card pad booking-row" [routerLink]="['/bookings', b.id]">
              <div class="stack-xs">
                <span class="muted small">{{ b.code }}</span>
                <strong>{{ b.serviceTitle }}</strong>
                <span class="muted small">{{ b.provider?.businessName }} · {{ b.startTime | date }}</span>
              </div>
              <div class="row-end">
                <app-status-badge [status]="b.status" />
                <strong>{{ b.price | currency: 'INR' : 'symbol' : '1.0-0' }}</strong>
              </div>
            </a>
          } @empty {
            <div class="card pad empty">
              No {{ tab() }} bookings. <a routerLink="/services">Browse services</a>
            </div>
          }
        </div>
        <app-pager [meta]="meta()" (go)="load($event)" />
      }
    </div>
  `,
})
export class MyBookings implements OnInit {
  private data = inject(DataService);
  protected tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ];
  protected tab = signal<Tab>('upcoming');
  protected bookings = signal<Booking[]>([]);
  protected meta = signal<PageMeta | null>(null);
  protected loading = signal(true);
  protected error = signal('');

  ngOnInit() { this.load(1); }

  select(t: Tab) { this.tab.set(t); this.load(1); }

  load(page: number) {
    this.loading.set(true);
    this.data.myBookings({ status: this.tab(), page }).subscribe({
      next: (r) => { this.bookings.set(r.items); this.meta.set(r.meta); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
