import { Component, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServiceItem } from '../core/models';

const TINTS = ['#CCFBF1', '#DBEAFE', '#FEF3C7', '#FCE7F3', '#E0E7FF', '#DCFCE7'];

@Component({
  selector: 'app-service-card',
  imports: [RouterLink, CurrencyPipe, DecimalPipe],
  template: `
    <article class="card service-card">
      <div class="service-cover" [style.background]="tint()">
        @if (service().imageUrl) { <img [src]="service().imageUrl" alt="" loading="lazy" /> }
        <span class="chip">{{ service().category?.name }}</span>
      </div>
      <div class="service-body">
        <h3>{{ service().title }}</h3>
        <p class="muted small">
          by <a [routerLink]="['/providers', service().provider?.id]">{{ service().provider?.businessName }}</a>
          · {{ duration() }}
        </p>
        <p class="muted small">
          @if (service().provider?.totalReviews) {
            ★ {{ service().provider?.avgRating | number: '1.1-1' }} ({{ service().provider?.totalReviews }} reviews)
          } @else { New provider }
        </p>
        <div class="service-foot">
          <strong class="price">{{ service().price | currency: 'INR' : 'symbol' : '1.0-0' }}</strong>
          <a class="btn btn-primary btn-sm" [routerLink]="['/services', service().id]">Book now</a>
        </div>
      </div>
    </article>
  `,
})
export class ServiceCard {
  readonly service = input.required<ServiceItem>();

  protected tint() {
    const key = this.service().category?.slug ?? '';
    let h = 0;
    for (const c of key) h = (h + c.charCodeAt(0)) % TINTS.length;
    return TINTS[h];
  }

  protected duration() {
    const m = this.service().durationMinutes;
    return m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? 's' : ''}`;
  }
}
