import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-how-it-works',
  imports: [PageHero, Icon, RouterLink],
  template: `
    <app-page-hero eyebrow="How it works" title="From search to done in four steps" lead="Service Hub connects customers with approved local professionals. Here's what happens on each side.">
      <div class="toggle on-hero" role="tablist" aria-label="Choose a side">
        <button type="button" role="tab" [class.active]="side() === 'customer'" [attr.aria-selected]="side() === 'customer'" (click)="side.set('customer')">I need a service</button>
        <button type="button" role="tab" [class.active]="side() === 'provider'" [attr.aria-selected]="side() === 'provider'" (click)="side.set('provider')">I offer a service</button>
      </div>
    </app-page-hero>

    <section class="container section">
      <ol class="steps">
        @for (s of (side() === 'customer' ? customerSteps : providerSteps); track s.title; let i = $index) {
          <li class="card pad step-card">
            <span class="step-num">{{ i + 1 }}</span>
            <span class="feature-ico"><app-icon [name]="s.icon" [size]="22" /></span>
            <h2 class="h3">{{ s.title }}</h2>
            <p class="muted">{{ s.text }}</p>
          </li>
        }
      </ol>
      <div class="center btn-row center-row">
        @if (side() === 'customer') {
          <a routerLink="/services" class="btn btn-primary">Browse services</a>
          <a routerLink="/register" class="btn btn-outline">Create a free account</a>
        } @else {
          <a routerLink="/register" [queryParams]="{ role: 'provider' }" class="btn btn-primary">Become a provider</a>
          <a routerLink="/pricing" class="btn btn-outline">See plans</a>
        }
      </div>
    </section>

    <section class="section-band">
      <div class="container stack-lg">
        <div class="center-head"><h2 class="h2-lg">The life of a booking</h2><p class="muted">Every change is saved on the booking's timeline, so both sides always see the same status.</p></div>
        <div class="status-flow" role="list">
          @for (st of statuses; track st.name) {
            <div class="card pad status-step" role="listitem">
              <span class="badge" [class]="'badge badge-' + st.key">{{ st.name }}</span>
              <p class="small muted">{{ st.text }}</p>
            </div>
          }
        </div>
        <p class="center small muted">A booking can also end as Cancelled, Rejected or No-show. <a routerLink="/help/booking-statuses">Read what each status means</a>.</p>
      </div>
    </section>
  `,
})
export class HowItWorks {
  protected side = signal<'customer' | 'provider'>('customer');
  protected customerSteps = [
    { icon: 'search', title: 'Find a service', text: 'Search by name or browse categories. Compare prices, durations and provider ratings.' },
    { icon: 'calendar', title: 'Pick a free slot', text: 'Choose a date and a time. Only slots the provider can really take are shown.' },
    { icon: 'bell', title: 'Get confirmation', text: 'The provider accepts your request and you are notified straight away.' },
    { icon: 'star', title: 'Get it done and review', text: 'After the job, the booking is marked completed and you can leave a rating.' },
  ];
  protected providerSteps = [
    { icon: 'users', title: 'Create your account', text: 'Register as a provider with your business name and city.' },
    { icon: 'briefcase', title: 'Add services and hours', text: 'List your services with prices and durations, then set your weekly hours and days off.' },
    { icon: 'shield', title: 'Get approved', text: 'Our team reviews your profile. Once approved, customers can find and book you.' },
    { icon: 'chart', title: 'Manage your bookings', text: 'Accept requests, mark jobs completed and watch your earnings grow.' },
  ];
  protected statuses = [
    { key: 'pending', name: 'Pending', text: 'Customer sent the request' },
    { key: 'confirmed', name: 'Confirmed', text: 'Provider accepted it' },
    { key: 'completed', name: 'Completed', text: 'Job done, review unlocked' },
  ];
}
