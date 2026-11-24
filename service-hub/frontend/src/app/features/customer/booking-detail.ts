import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StatusBadge, statusLabel } from '../../shared/status-badge';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { Booking, BookingStatus } from '../../core/models';

const FLOW: BookingStatus[] = ['pending', 'confirmed', 'completed'];

@Component({
  selector: 'app-booking-detail',
  imports: [StatusBadge, RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="container page narrow">
      @if (error()) {
        <div class="card pad empty">{{ error() }}</div>
      } @else if (booking(); as b) {
        <a [routerLink]="backLink()" class="small">← Back</a>
        <section class="card pad stack">
          <div class="row-between">
            <h1>{{ b.code }}</h1>
            <app-status-badge [status]="b.status" />
          </div>
          <dl class="summary">
            <dt>Service</dt><dd>{{ b.serviceTitle }}</dd>
            <dt>Provider</dt><dd>{{ b.provider?.businessName }}</dd>
            @if (auth.role() !== 'customer') { <dt>Customer</dt><dd>{{ b.customer?.name }} · {{ b.customer?.phone }}</dd> }
            <dt>When</dt><dd>{{ b.startTime | date }}</dd>
            <dt>Address</dt><dd>{{ b.address }}</dd>
            @if (b.notes) { <dt>Notes</dt><dd>{{ b.notes }}</dd> }
            <dt>Amount</dt><dd>{{ b.price | currency: 'INR' : 'symbol' : '1.0-0' }}</dd>
          </dl>

          <h2>Status timeline</h2>
          <ol class="timeline">
            @for (h of b.statusHistory; track $index) {
              <li class="done">
                <strong>{{ label(h.status) }}</strong>
                <span class="muted small">{{ h.at | date }} · by {{ h.byRole }}@if (h.note) { · "{{ h.note }}" }</span>
              </li>
            }
            @for (s of upcomingSteps(); track s) {
              <li class="todo"><strong>{{ label(s) }}</strong><span class="muted small">Waiting</span></li>
            }
          </ol>

          @if (canCancel()) {
            <div class="stack">
              @if (confirmCancel()) {
                <div class="field">
                  <label for="reason">Reason (optional)</label>
                  <input id="reason" #reason />
                </div>
                <div class="btn-row">
                  <button type="button" class="btn btn-danger" [disabled]="busy()" (click)="cancel(reason.value)">Yes, cancel booking</button>
                  <button type="button" class="btn btn-outline" (click)="confirmCancel.set(false)">Keep booking</button>
                </div>
              } @else {
                <button type="button" class="btn btn-outline-danger" (click)="confirmCancel.set(true)">Cancel booking</button>
              }
              <span class="muted small">Free cancellation up to 2 hours before the slot.</span>
            </div>
          }

          @if (canReview()) {
            <form class="stack review-form" [formGroup]="reviewForm" (ngSubmit)="submitReview(b)">
              <h2>Rate this service</h2>
              <div class="stars" role="radiogroup" aria-label="Rating">
                @for (n of [1, 2, 3, 4, 5]; track n) {
                  <button type="button" role="radio" class="star" [class.on]="n <= reviewForm.controls.rating.value"
                    [attr.aria-checked]="n === reviewForm.controls.rating.value" [attr.aria-label]="n + ' stars'"
                    (click)="reviewForm.controls.rating.setValue(n)">★</button>
                }
              </div>
              <div class="field">
                <label for="comment">Comment (optional)</label>
                <textarea id="comment" rows="3" formControlName="comment"></textarea>
              </div>
              <button class="btn btn-primary" type="submit" [disabled]="busy() || reviewForm.invalid">Submit review</button>
            </form>
          }
          @if (b.reviewed) { <p class="alert alert-success">Thanks! You reviewed this booking.</p> }
        </section>
      } @else {
        <p class="muted">Loading…</p>
      }
    </div>
  `,
})
export class BookingDetail {
  readonly id = input.required<string>();
  private data = inject(DataService);
  private toast = inject(ToastService);
  protected auth = inject(AuthService);
  protected booking = signal<Booking | null>(null);
  protected error = signal('');
  protected busy = signal(false);
  protected confirmCancel = signal(false);
  protected reviewForm = inject(FormBuilder).nonNullable.group({
    rating: [0, [Validators.min(1), Validators.max(5)]],
    comment: ['', Validators.maxLength(1000)],
  });

  protected label = statusLabel;

  protected upcomingSteps = computed(() => {
    const b = this.booking();
    if (!b || !FLOW.includes(b.status)) return [];
    return FLOW.slice(FLOW.indexOf(b.status) + 1);
  });

  protected canCancel = computed(() => {
    const b = this.booking();
    if (!b || this.auth.role() !== 'customer' || !['pending', 'confirmed'].includes(b.status)) return false;
    return new Date(b.startTime).getTime() - Date.now() > 2 * 3600 * 1000;
  });

  protected canReview = computed(() => {
    const b = this.booking();
    return !!b && this.auth.role() === 'customer' && b.status === 'completed' && !b.reviewed;
  });

  protected backLink = computed(() => {
    const role = this.auth.role();
    return role === 'provider' ? '/provider/bookings' : role === 'admin' ? '/admin/bookings' : '/bookings';
  });

  constructor() {
    effect(() => {
      this.data.booking(this.id()).subscribe({ next: (b) => this.booking.set(b), error: (e) => this.error.set(errorMessage(e)) });
    });
  }

  cancel(reason: string) {
    const b = this.booking();
    if (!b) return;
    this.busy.set(true);
    this.data.changeStatus(b.id, 'cancelled', reason).subscribe({
      next: (updated) => { this.booking.set(updated); this.busy.set(false); this.confirmCancel.set(false); this.toast.success('Booking cancelled'); },
      error: (e) => { this.busy.set(false); this.toast.error(errorMessage(e)); },
    });
  }

  submitReview(b: Booking) {
    this.busy.set(true);
    this.data.review({ bookingId: b.id, ...this.reviewForm.getRawValue() }).subscribe({
      next: () => { this.booking.set({ ...b, reviewed: true }); this.busy.set(false); this.toast.success('Thanks for your review!'); },
      error: (e) => { this.busy.set(false); this.toast.error(errorMessage(e)); },
    });
  }
}
