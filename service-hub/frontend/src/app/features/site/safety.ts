import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-safety',
  imports: [PageHero, Icon, RouterLink],
  template: `
    <app-page-hero eyebrow="Trust & safety" title="Built to keep customers and providers safe" lead="How we protect your account, your bookings and your personal details." />
    <section class="container section">
      <div class="grid two">
        @for (s of items; track s.title) {
          <div class="card pad stack">
            <div class="row-start"><span class="feature-ico"><app-icon [name]="s.icon" [size]="22" /></span><h2 class="h3">{{ s.title }}</h2></div>
            <p class="muted">{{ s.text }}</p>
          </div>
        }
      </div>
    </section>
    <section class="container section">
      <div class="card pad-lg stack">
        <h2 class="h2-lg">Safety tips for customers</h2>
        <ul class="check-list">
          <li><app-icon name="check" [size]="18" /> Keep all booking communication on Service Hub so there's a record.</li>
          <li><app-icon name="check" [size]="18" /> Check the provider's rating and reviews before you book.</li>
          <li><app-icon name="check" [size]="18" /> Pay only after the service is done, and agree on any extra costs first.</li>
          <li><app-icon name="check" [size]="18" /> Report anything unusual to our team through the <a routerLink="/contact">contact page</a>.</li>
        </ul>
      </div>
    </section>
  `,
})
export class Safety {
  protected items = [
    { icon: 'shield', title: 'Approved providers', text: 'Every provider account is reviewed by an admin before its services are shown. Accounts that break the rules can be blocked at once.' },
    { icon: 'lock', title: 'Secure accounts', text: 'Passwords are stored only as secure hashes. Login attempts are rate-limited to stop password guessing.' },
    { icon: 'users', title: 'Private by default', text: 'Your address and phone are shown only to the provider of your booking. Other customers can never see your bookings.' },
    { icon: 'star', title: 'Honest reviews', text: 'Only customers who completed a booking can review it, and only once.' },
    { icon: 'list', title: 'Full booking history', text: 'Every status change records who made it and when, so there is always a clear record.' },
    { icon: 'calendar', title: 'Reliable scheduling', text: 'The system guarantees one booking per time slot, so providers are never double-booked.' },
  ];
}
