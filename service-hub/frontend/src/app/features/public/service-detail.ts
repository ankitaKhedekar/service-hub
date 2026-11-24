import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { nextDays } from '../../core/time';
import { Booking, ServiceItem, Slot } from '../../core/models';

@Component({
  selector: 'app-service-detail',
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="container page">
      @if (loadError()) {
        <div class="card pad empty">{{ loadError() }} <a routerLink="/services">Back to services</a></div>
      } @else if (service(); as s) {
        <nav class="crumbs small" aria-label="Breadcrumb">
          <a routerLink="/">Home</a> / <a routerLink="/services" [queryParams]="{ category: s.category?.slug }">{{ s.category?.name }}</a> / <span>{{ s.title }}</span>
        </nav>
        <div class="split">
          <div class="stack-lg main-col">
            <section class="card pad stack">
              <span class="chip chip-blue">{{ s.category?.name }}</span>
              <h1>{{ s.title }}</h1>
              <p class="muted">
                Duration: {{ s.durationMinutes }} min
                @if (s.provider?.totalReviews) { · Rated {{ s.provider?.avgRating | number: '1.1-1' }} ({{ s.provider?.totalReviews }} reviews) }
                · {{ s.provider?.city }}
              </p>
              <p>{{ s.description || 'No description provided.' }}</p>
              <div class="provider-line">
                <span class="avatar">{{ initials(s.provider?.businessName) }}</span>
                <div>
                  <a [routerLink]="['/providers', s.provider?.id]"><strong>{{ s.provider?.businessName }}</strong></a>
                  <div class="muted small">Verified provider · {{ s.provider?.experienceYears }} years experience</div>
                </div>
              </div>
            </section>

            <section class="card pad stack">
              <h2>1. Choose a date</h2>
              <div class="date-row" role="group" aria-label="Dates">
                @for (d of days; track d.value) {
                  <button type="button" class="date-pill" [class.selected]="d.value === date()" [attr.aria-pressed]="d.value === date()" (click)="pickDate(d.value)">
                    <span class="small">{{ d.day }}</span><strong>{{ d.num }}</strong><span class="small">{{ d.month }}</span>
                  </button>
                }
              </div>
              <h2>2. Choose a time</h2>
              @if (slotsLoading()) {
                <p class="muted">Loading free slots…</p>
              } @else if (slots().length === 0) {
                <p class="muted">No slots on this day. The provider may be closed or on leave - try another date.</p>
              } @else {
                <div class="slot-grid" role="group" aria-label="Time slots">
                  @for (slot of slots(); track slot.start) {
                    <button type="button" class="slot" [class.selected]="slot.start === selected()?.start" [disabled]="!slot.available"
                      [attr.aria-pressed]="slot.start === selected()?.start" (click)="selected.set(slot)">{{ slot.label }}</button>
                  }
                </div>
                <div class="legend small">
                  <span><i class="swatch"></i>Available</span><span><i class="swatch sel"></i>Selected</span><span><i class="swatch off"></i>Booked</span>
                </div>
              }
            </section>
          </div>

          <aside class="card pad stack side-col">
            <h2>Booking summary</h2>
            <dl class="summary">
              <dt>Service</dt><dd>{{ s.title }}</dd>
              <dt>Provider</dt><dd>{{ s.provider?.businessName }}</dd>
              <dt>Date</dt><dd>{{ date() }}</dd>
              <dt>Time</dt><dd>{{ selected()?.label ?? 'Select a slot' }}</dd>
            </dl>
            @if (booked(); as b) {
              <div class="alert alert-success" role="status">
                <strong>Booking requested</strong><br />
                {{ b.code }} · {{ b.startTime | date }} · Status: Pending
              </div>
              <a class="btn btn-primary block" [routerLink]="['/bookings', b.id]">View booking</a>
            } @else if (!auth.isLoggedIn()) {
              <a class="btn btn-primary block" routerLink="/login" [queryParams]="{ returnUrl: '/services/' + s.id }">Log in to book</a>
            } @else if (auth.role() !== 'customer') {
              <p class="alert alert-info">Only customer accounts can make bookings.</p>
            } @else {
              <form class="stack" [formGroup]="form" (ngSubmit)="book(s)">
                <div class="field">
                  <label for="address">Service address</label>
                  <textarea id="address" rows="2" formControlName="address"></textarea>
                  @if (form.controls.address.touched && form.controls.address.invalid) { <span class="error">Enter the full address (at least 5 characters)</span> }
                </div>
                <div class="field">
                  <label for="notes">Notes for the provider (optional)</label>
                  <textarea id="notes" rows="2" formControlName="notes"></textarea>
                </div>
                <div class="total"><span>Total</span><strong>{{ s.price | currency: 'INR' : 'symbol' : '1.0-0' }}</strong></div>
                <button class="btn btn-primary block" type="submit" [disabled]="!selected() || saving()">{{ saving() ? 'Booking…' : 'Confirm booking' }}</button>
                <span class="muted small center">Status starts as Pending until the provider confirms.</span>
              </form>
            }
          </aside>
        </div>
      } @else {
        <p class="muted">Loading…</p>
      }
    </div>
  `,
})
export class ServiceDetail {
  readonly id = input.required<string>(); // bound from the :id route param

  private data = inject(DataService);
  private toast = inject(ToastService);
  protected auth = inject(AuthService);

  protected days = nextDays(14);
  protected service = signal<ServiceItem | null>(null);
  protected loadError = signal('');
  protected date = signal(this.days[0].value);
  protected slots = signal<Slot[]>([]);
  protected slotsLoading = signal(false);
  protected selected = signal<Slot | null>(null);
  protected saving = signal(false);
  protected booked = signal<Booking | null>(null);
  protected hasSlots = computed(() => this.slots().some((s) => s.available));

  protected form = inject(FormBuilder).nonNullable.group({
    address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    notes: ['', Validators.maxLength(500)],
  });

  constructor() {
    effect(() => {
      const id = this.id();
      this.data.service(id).subscribe({
        next: (s) => { this.service.set(s); this.loadSlots(); },
        error: (e) => this.loadError.set(errorMessage(e)),
      });
    });
  }

  pickDate(value: string) {
    this.date.set(value);
    this.selected.set(null);
    this.loadSlots();
  }

  book(s: ServiceItem) {
    const slot = this.selected();
    if (!slot) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.data.createBooking({ serviceId: s.id, startTime: slot.start, ...this.form.getRawValue() }).subscribe({
      next: (b) => { this.booked.set(b); this.saving.set(false); this.toast.success('Booking requested'); },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.error(errorMessage(e));
        if (e.status === 409) { this.selected.set(null); this.loadSlots(); } // someone else took it - refresh
      },
    });
  }

  initials(name?: string) {
    return (name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  private loadSlots() {
    const s = this.service();
    if (!s) return;
    this.slotsLoading.set(true);
    this.data.slots(s.id, this.date()).subscribe({
      next: (r) => { this.slots.set(r.slots); this.slotsLoading.set(false); },
      error: (e) => { this.slots.set([]); this.slotsLoading.set(false); this.toast.error(errorMessage(e)); },
    });
  }
}
