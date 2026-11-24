import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-about',
  imports: [PageHero, Icon, RouterLink],
  template: `
    <app-page-hero eyebrow="About us" title="Making local services easy to book" lead="Service Hub started with a simple idea: booking a plumber or a beautician should be as easy as ordering food." />
    <section class="container section">
      <div class="alt-row">
        <div class="stack prose">
          <h2 class="h2-lg">Why we built it</h2>
          <p>Most local professionals still take bookings over phone calls and messages. Customers wait for replies, and providers lose jobs when they can't answer in time.</p>
          <p>Service Hub puts each provider's real availability online. Customers book a free slot in a minute, and providers manage everything from one dashboard.</p>
        </div>
        <div class="grid two">
          @for (v of values; track v.title) {
            <div class="card pad stack-xs"><span class="feature-ico"><app-icon [name]="v.icon" [size]="22" /></span><strong>{{ v.title }}</strong><span class="muted small">{{ v.text }}</span></div>
          }
        </div>
      </div>
    </section>
    <section class="container section">
      <div class="cta-band">
        <div class="stack"><h2 class="h2-lg light">Join us</h2><p>Book your first service, or list your business and start getting bookings.</p></div>
        <div class="btn-row">
          <a class="btn btn-light" routerLink="/services">Book a service</a>
          <a class="btn btn-ghost-light" routerLink="/register" [queryParams]="{ role: 'provider' }">Become a provider</a>
        </div>
      </div>
    </section>
  `,
})
export class About {
  protected values = [
    { icon: 'shield', title: 'Trust first', text: 'Every provider is reviewed before going live.' },
    { icon: 'clock', title: 'Respect time', text: 'Only real free slots, never double-booked.' },
    { icon: 'heart', title: 'Fair to both sides', text: 'Clear prices for customers, clear rules for providers.' },
    { icon: 'chat', title: 'Human support', text: 'Real people read and answer every message.' },
  ];
}
