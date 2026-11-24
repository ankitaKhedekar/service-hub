import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { statusLabel } from '../../shared/status-badge';
import { AdminStats } from '../../core/models';

const STATUS_COLORS: Record<string, string> = {
  completed: '#15803D', confirmed: '#1D4ED8', pending: '#D97706', cancelled: '#64748B', rejected: '#B91C1C', no_show: '#7C3AED',
};

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <div class="stack-lg">
      <div class="row-between">
        <h1>Dashboard</h1>
        <div class="field inline">
          <label for="period">Period</label>
          <select id="period" (change)="load(+$any($event.target).value)">
            <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
          </select>
        </div>
      </div>
      @if (stats(); as s) {
        <div class="grid stats">
          <div class="card pad stat"><span class="muted">Bookings</span><strong>{{ s.totalBookings }}</strong><span class="muted small">Created in the last {{ s.days }} days</span></div>
          <div class="card pad stat"><span class="muted">Revenue</span><strong>{{ s.revenue | currency: 'INR' : 'symbol' : '1.0-0' }}</strong><span class="muted small">From completed bookings</span></div>
          <div class="card pad stat"><span class="muted">Active providers</span><strong>{{ s.activeProviders }}</strong>
            <a class="small" routerLink="/admin/providers">{{ s.pendingProviders }} waiting for approval</a></div>
          <div class="card pad stat"><span class="muted">Customers</span><strong>{{ s.customers }}</strong><span class="muted small">{{ s.newCustomers }} new in this period</span></div>
        </div>

        <div class="split-even">
          <section class="card pad stack">
            <h2>Bookings per day</h2>
            <div class="bar-chart" role="img" [attr.aria-label]="chartLabel()">
              @for (d of s.perDay; track d.date) {
                <div class="bar-col">
                  <span class="small muted">{{ d.count }}</span>
                  <div class="bar" [style.height.%]="max() ? (d.count / max()) * 100 : 0"></div>
                  <span class="small muted bar-label">{{ s.days <= 14 ? d.label : '' }}</span>
                </div>
              }
            </div>
          </section>
          <section class="card pad stack">
            <h2>Bookings by status</h2>
            @for (b of s.byStatus; track b.status) {
              <div class="stack-xs">
                <div class="row-between small"><span>{{ label(b.status) }}</span><strong>{{ b.count }}</strong></div>
                <div class="meter"><div [style.width.%]="statusTotal() ? (b.count / statusTotal()) * 100 : 0" [style.background]="color(b.status)"></div></div>
              </div>
            }
          </section>
        </div>

        <section class="card pad stack">
          <h2>Top services</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Service</th><th>Bookings</th><th>Revenue (completed)</th></tr></thead>
              <tbody>
                @for (t of s.topServices; track t.title) {
                  <tr><td>{{ t.title }}</td><td>{{ t.bookings }}</td><td>{{ t.revenue | currency: 'INR' : 'symbol' : '1.0-0' }}</td></tr>
                } @empty { <tr><td colspan="3" class="muted">No bookings in this period.</td></tr> }
              </tbody>
            </table>
          </div>
        </section>
      } @else {
        <p class="muted">Loading…</p>
      }
    </div>
  `,
})
export class AdminDashboard implements OnInit {
  private data = inject(DataService);
  protected stats = signal<AdminStats | null>(null);
  protected max = computed(() => Math.max(0, ...(this.stats()?.perDay.map((d) => d.count) ?? [0])));
  protected statusTotal = computed(() => (this.stats()?.byStatus ?? []).reduce((sum, b) => sum + b.count, 0));
  protected chartLabel = computed(() => 'Bookings per day: ' + (this.stats()?.perDay.map((d) => `${d.label} ${d.count}`).join(', ') ?? ''));
  protected label = statusLabel;

  ngOnInit() { this.load(7); }

  load(days: number) { this.data.adminStats(days).subscribe((s) => this.stats.set(s)); }

  color(status: string) { return STATUS_COLORS[status] ?? '#64748B'; }
}
