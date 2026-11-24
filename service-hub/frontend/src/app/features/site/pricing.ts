import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';
import { FaqList } from '../../shared/faq-list';
import { PLANS, Plan } from '../../content/site-content';

@Component({
  selector: 'app-pricing',
  imports: [PageHero, Icon, FaqList, RouterLink, DecimalPipe],
  template: `
    <app-page-hero eyebrow="Plans & pricing" title="Simple plans for every provider" lead="Booking is always free for customers. Providers start free and upgrade when they grow.">
      <div class="toggle on-hero" role="tablist" aria-label="Billing period">
        <button type="button" role="tab" [class.active]="!yearly()" [attr.aria-selected]="!yearly()" (click)="yearly.set(false)">Monthly</button>
        <button type="button" role="tab" [class.active]="yearly()" [attr.aria-selected]="yearly()" (click)="yearly.set(true)">Yearly <span class="save">Save 20%</span></button>
      </div>
    </app-page-hero>

    <section class="container section">
      <div class="grid plans">
        @for (p of plans; track p.id) {
          <article class="card pad-lg plan" [class.highlight]="p.highlight">
            @if (p.highlight) { <span class="plan-tag">Most popular</span> }
            <h2>{{ p.name }}</h2>
            <p class="muted small">{{ p.tagline }}</p>
            <div class="plan-price">
              @if (p.monthly === null) {
                <strong>Custom</strong>
              } @else if (p.monthly === 0) {
                <strong>₹0</strong><span class="muted">forever</span>
              } @else {
                <strong>₹{{ price(p) | number: '1.0-0' }}</strong><span class="muted">/ month{{ yearly() ? ', billed yearly' : '' }}</span>
              }
            </div>
            <a class="btn block" [class.btn-primary]="p.highlight" [class.btn-outline]="!p.highlight"
              [routerLink]="p.monthly === null ? '/contact' : '/register'" [queryParams]="p.monthly === null ? { topic: 'partnership' } : { role: 'provider' }">{{ p.cta }}</a>
            <ul class="check-list">
              @for (f of p.features; track f) { <li><app-icon name="check" [size]="18" /> {{ f }}</li> }
            </ul>
          </article>
        }
      </div>
      <p class="center small muted">Demo pricing: plan limits and billing are not active yet. All prices in INR, taxes extra.</p>
    </section>

    <section class="section-band">
      <div class="container narrow-center stack-lg">
        <div class="center-head"><h2 class="h2-lg">Pricing questions</h2></div>
        <app-faq-list [items]="faqs" />
      </div>
    </section>
  `,
})
export class Pricing {
  protected plans = PLANS;
  protected yearly = signal(false);
  protected faqs = [
    { q: 'Is Service Hub free for customers?', a: 'Yes. Customers never pay to browse or book. They pay the provider for the service.' },
    { q: 'Can I change plans later?', a: 'Yes, you can move between plans at any time.' },
    { q: 'Do you take a commission on bookings?', a: 'No. Plans are a flat monthly fee, whatever you earn.' },
    { q: 'What payment methods will you accept?', a: 'UPI, cards and net banking once billing goes live.' },
  ];

  price(p: Plan) {
    return this.yearly() ? Math.round((p.monthly ?? 0) * 0.8) : p.monthly ?? 0;
  }
}
