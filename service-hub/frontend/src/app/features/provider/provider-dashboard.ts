import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { StatusBadge } from '../../shared/status-badge';
import { BookingActions } from './booking-actions';
import { Booking, ProviderStats } from '../../core/models';
import { dateInZone } from '../../core/time';

@Component({
  selector: 'app-provider-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, StatusBadge, BookingActions],
  template: `
    <div class="stack-lg">
      <div class="row-between">
        <h1>Hello, {{ auth.user()?.name }}</h1>
        @if (stats(); as s) { <app-status-badge [status]="s.approvalStatus" /> }
      </div>

      @if (stats()?.approvalStatus === 'pending') {
        <p class="alert alert-warn">Your account is waiting for admin approval. You can add services and set your hours now - customers will see them once you are approved.</p>
      }
      @if (stats()?.approvalStatus === 'rejected') {
        <p class="alert alert-error">Your provider application was not approved. Please update your profile and contact support.</p>
      }

      @if (stats(); as s) {
        <div class="grid stats">
          <div class="card pad stat"><span class="muted">Today's bookings</span><strong>{{ s.todayBookings }}</strong></div>
          <div class="card pad stat"><span class="muted">Pending requests</span><strong>{{ s.pendingRequests }}</strong></div>
          <div class="card pad stat"><span class="muted">Earnings this month</span><strong>{{ s.monthEarnings | currency: 'INR' : 'symbol' : '1.0-0' }}</strong><span class="muted small">{{ s.monthCompletedJobs }} completed jobs</span></div>
          <div class="card pad stat"><span class="muted">Average rating</span><strong>{{ s.totalReviews ? (s.avgRating | number: '1.1-1') : '-' }}</strong><span class="muted small">{{ s.totalReviews }} reviews</span></div>
        </div>
      }

      <section class="card pad stack">
        <div class="row-between"><h2>New booking requests</h2><a routerLink="/provider/bookings">All bookings</a></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Booking</th><th>Customer</th><th>Service</th><th>Slot</th><th>Status</th><th class="right">Action</th></tr></thead>
            <tbody>
              @for (b of pending(); track b.id) {
                <tr>
                  <td><a [routerLink]="['/bookings', b.id]">{{ b.code }}</a></td>
                  <td>{{ b.customer?.name }}</td>
                  <td>{{ b.serviceTitle }}</td>
                  <td>{{ b.startTime | date }}</td>
                  <td><app-status-badge [status]="b.status" /></td>
                  <td class="right"><app-booking-actions [booking]="b" (changed)="reload()" /></td>
                </tr>
              } @empty { <tr><td colspan="6" class="muted">No pending requests.</td></tr> }
            </tbody>
          </table>
        </div>
      </section>

      <section class="card pad stack">
        <h2>Today's schedule</h2>
        @for (b of today(); track b.id) {
          <div class="schedule-row">
            <strong class="time">{{ b.startTime | date: 'h:mm a' }}</strong>
            <div class="grow"><strong>{{ b.serviceTitle }}</strong><div class="muted small">{{ b.customer?.name }} · {{ b.address }}</div></div>
            <app-status-badge [status]="b.status" />
            <app-booking-actions [booking]="b" (changed)="reload()" />
          </div>
        } @empty { <p class="muted">Nothing scheduled for today.</p> }
      </section>
    </div>
  `,
})
export class ProviderDashboard implements OnInit {
  private data = inject(DataService);
  protected auth = inject(AuthService);
  protected stats = signal<ProviderStats | null>(null);
  protected pending = signal<Booking[]>([]);
  protected today = signal<Booking[]>([]);

  ngOnInit() { this.reload(); }

  reload() {
    const today = dateInZone(new Date());
    this.data.providerStats().subscribe((s) => this.stats.set(s));
    this.data.providerBookings({ status: 'pending' }).subscribe((r) => this.pending.set(r.items.filter((b) => new Date(b.startTime) > new Date())));
    this.data.providerBookings({ from: today, to: today }).subscribe((r) => this.today.set(r.items.filter((b) => ['confirmed', 'completed', 'no_show'].includes(b.status))));
  }
}
