import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

// Template text for a portfolio project. Have a lawyer review real terms before launching a business.
const DOCS = {
  terms: {
    title: 'Terms of service',
    sections: [
      ['Using Service Hub', 'Service Hub is a platform that connects customers with independent service providers. Providers, not Service Hub, perform the services and are responsible for their quality.'],
      ['Accounts', 'You must give accurate information and keep your password safe. You are responsible for activity on your account. We may suspend accounts that break these terms.'],
      ['Bookings and cancellations', 'A booking is a request until the provider confirms it. Customers can cancel free of charge up to 2 hours before the start time. Providers should only accept bookings they can fulfil.'],
      ['Payments', 'Customers pay providers directly for services. Provider plan fees, when billing is live, are charged in advance and are non-refundable except where the law requires.'],
      ['Reviews', 'Reviews must be honest and about a real, completed booking. We may remove reviews that are abusive, false or unrelated.'],
      ['Liability', 'To the extent allowed by law, Service Hub is not liable for the acts of providers or customers, or for indirect losses.'],
      ['Changes', 'We may update these terms. We will show the new date at the top of this page.'],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    sections: [
      ['What we collect', 'Account details (name, email, phone), booking details (service, time, address, notes), reviews you write, and basic technical logs.'],
      ['Why we use it', 'To run bookings, notify you about status changes, keep the platform secure and improve our service.'],
      ['Who can see it', 'Your booking details are shared only with the provider of that booking and our admins. We do not sell your personal data.'],
      ['How we protect it', 'Passwords are stored as secure hashes, connections use HTTPS, and access is limited by role.'],
      ['Newsletter', 'If you subscribe, we use your email only to send the newsletter. Ask us at any time to remove it.'],
      ['Your choices', 'You can ask us to correct or delete your data through the contact page.'],
    ],
  },
} as const;

@Component({
  selector: 'app-legal',
  imports: [RouterLink],
  template: `
    <div class="container page narrow">
      <article class="card pad-lg stack prose">
        <h1>{{ doc().title }}</h1>
        <p class="muted small">Last updated: 19 November 2026</p>
        @for (s of doc().sections; track s[0]; let i = $index) {
          <h2 class="h3">{{ i + 1 }}. {{ s[0] }}</h2>
          <p>{{ s[1] }}</p>
        }
        <p class="muted small">Questions? <a routerLink="/contact">Contact us</a>.</p>
      </article>
    </div>
  `,
})
export class Legal {
  readonly kind = input<'terms' | 'privacy'>('terms'); // from route data
  protected doc = computed(() => DOCS[this.kind()]);
}
