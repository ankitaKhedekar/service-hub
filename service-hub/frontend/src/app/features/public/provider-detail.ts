import { Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServiceCard } from '../../shared/service-card';
import { DataService } from '../../core/data.service';
import { errorMessage } from '../../core/api.service';
import { ProviderSummary, Review, ServiceItem } from '../../core/models';

@Component({
  selector: 'app-provider-detail',
  imports: [ServiceCard, RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="container page">
      @if (error()) {
        <div class="card pad empty">{{ error() }} <a routerLink="/services">Back to services</a></div>
      } @else if (provider(); as p) {
        <section class="card pad stack">
          <h1>{{ p.businessName }}</h1>
          <p class="muted">{{ p.city }} · {{ p.experienceYears }} years experience
            @if (p.totalReviews) { · Rated {{ p.avgRating | number: '1.1-1' }} from {{ p.totalReviews }} reviews }</p>
          <p>{{ p.bio }}</p>
        </section>
        <section class="section">
          <h2>Services</h2>
          <div class="grid services">
            @for (s of services(); track s.id) { <app-service-card [service]="s" /> }
            @empty { <p class="muted">No active services.</p> }
          </div>
        </section>
        <section class="section">
          <h2>Reviews</h2>
          <div class="stack">
            @for (r of reviews(); track r.id) {
              <div class="card pad">
                <strong>{{ '★'.repeat(r.rating) }}</strong> <span class="muted small">by {{ r.customerName }} · {{ r.createdAt | date: 'd MMM y' }}</span>
                @if (r.comment) { <p>{{ r.comment }}</p> }
              </div>
            } @empty { <p class="muted">No reviews yet.</p> }
          </div>
        </section>
      } @else {
        <p class="muted">Loading…</p>
      }
    </div>
  `,
})
export class ProviderDetail {
  readonly id = input.required<string>();
  private data = inject(DataService);
  protected provider = signal<ProviderSummary | null>(null);
  protected services = signal<ServiceItem[]>([]);
  protected reviews = signal<Review[]>([]);
  protected error = signal('');

  constructor() {
    effect(() => {
      this.data.provider(this.id()).subscribe({
        next: (r) => { this.provider.set(r.provider); this.services.set(r.services); this.reviews.set(r.reviews); },
        error: (e) => this.error.set(errorMessage(e)),
      });
    });
  }
}
