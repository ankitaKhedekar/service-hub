import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServiceCard } from '../../shared/service-card';
import { Icon } from '../../shared/icon';
import { FaqList } from '../../shared/faq-list';
import { Newsletter } from '../../shared/newsletter';
import { DataService } from '../../core/data.service';
import { Category, ServiceItem, SiteReview, SiteStats } from '../../core/models';
import { FAQ_GROUPS, INDUSTRIES } from '../../content/site-content';

type HeroView = 'customer' | 'provider';
type FeatureTab = 'booking' | 'tracking' | 'providers' | 'trust';

const FEATURES: Record<FeatureTab, { icon: string; title: string; text: string }[]> = {
  booking: [
    { icon: 'search', title: 'Search and filter', text: 'Find services by category, city and price in seconds.' },
    { icon: 'calendar', title: 'Live free slots', text: 'See only the times a provider can really take.' },
    { icon: 'clock', title: 'Book in under a minute', text: 'Pick a slot, add your address and confirm.' },
    { icon: 'rupee', title: 'Clear prices', text: 'The price you see is the price saved with your booking.' },
  ],
  tracking: [
    { icon: 'list', title: 'Status timeline', text: 'Follow every step from Pending to Completed.' },
    { icon: 'bell', title: 'Notifications', text: 'Know the moment a provider confirms or changes your booking.' },
    { icon: 'close', title: 'Free cancellation', text: 'Cancel up to 2 hours before the start time.' },
    { icon: 'star', title: 'Reviews', text: 'Rate completed jobs and help others choose.' },
  ],
  providers: [
    { icon: 'calendar', title: 'Your hours, your rules', text: 'Weekly hours, breaks, slot length and days off.' },
    { icon: 'check', title: 'Accept or decline', text: 'Every request waits for your answer.' },
    { icon: 'chart', title: 'Earnings dashboard', text: 'Today\'s jobs, pending requests and monthly earnings.' },
    { icon: 'briefcase', title: 'Service catalogue', text: 'Add, edit and hide services anytime.' },
  ],
  trust: [
    { icon: 'shield', title: 'Approved providers', text: 'Every provider is reviewed by our team before going live.' },
    { icon: 'lock', title: 'Secure accounts', text: 'Hashed passwords and permission checks on every request.' },
    { icon: 'users', title: 'Private bookings', text: 'Only you and your provider can see your booking details.' },
    { icon: 'calendar', title: 'No double-booking', text: 'Two customers can never get the same slot.' },
  ],
};

@Component({
  selector: 'app-home',
  imports: [ServiceCard, Icon, FaqList, Newsletter, ReactiveFormsModule, RouterLink, DecimalPipe, DatePipe],
  template: `
    <!-- ===== Hero ===== -->
    <section class="home-hero">
      <div class="container hero-grid">
        <div class="stack-lg">
          <span class="eyebrow">Online booking for local services</span>
          <h1 class="display">Book trusted professionals for every job at home.</h1>
          <p class="lead">Compare verified providers, pick a time that is really free, and follow your booking from request to completion.</p>
          <form class="search-bar" [formGroup]="search" (ngSubmit)="go()">
            <div class="field grow">
              <label for="q">What do you need?</label>
              <input id="q" formControlName="q" placeholder="e.g. AC repair, deep cleaning" />
            </div>
            <div class="field">
              <label for="city">City</label>
              <input id="city" formControlName="city" placeholder="Any city" />
            </div>
            <button class="btn btn-primary" type="submit"><app-icon name="search" [size]="18" /> Search</button>
          </form>
          <div class="hero-links">
            <a routerLink="/how-it-works" class="link-arrow">See how it works <app-icon name="arrow" [size]="16" /></a>
            <span class="muted small">Free for customers. No card needed.</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="toggle" role="tablist" aria-label="Preview">
            <button type="button" role="tab" [attr.aria-selected]="view() === 'customer'" [class.active]="view() === 'customer'" (click)="view.set('customer')">Customer view</button>
            <button type="button" role="tab" [attr.aria-selected]="view() === 'provider'" [class.active]="view() === 'provider'" (click)="view.set('provider')">Provider view</button>
          </div>
          @if (view() === 'customer') {
            <div class="mock card" aria-label="Example of the booking screen">
              <div class="mock-head"><strong>Split AC service</strong><span class="chip chip-blue">AC repair</span></div>
              <span class="muted small">Choose a time · Fri 21 Nov</span>
              <div class="mock-slots">
                <span class="mslot">09:00</span><span class="mslot sel">10:00</span><span class="mslot off">11:00</span>
                <span class="mslot">12:00</span><span class="mslot off">14:00</span><span class="mslot">15:00</span>
              </div>
              <div class="mock-foot"><span class="muted small">Total</span><strong>₹599</strong></div>
              <span class="btn btn-primary btn-sm block">Confirm booking</span>
            </div>
          } @else {
            <div class="mock card" aria-label="Example of the provider dashboard">
              <div class="mock-head"><strong>New requests</strong><span class="badge badge-pending">3 pending</span></div>
              @for (r of mockRequests; track r.name) {
                <div class="mock-row">
                  <div><strong class="small">{{ r.name }}</strong><div class="muted small">{{ r.when }}</div></div>
                  <span class="btn btn-primary btn-sm">Accept</span>
                </div>
              }
              <div class="mock-foot"><span class="muted small">Earnings this month</span><strong>₹18,450</strong></div>
            </div>
          }
        </div>
      </div>

      @if (stats(); as s) {
        <div class="container">
          <ul class="stat-strip" aria-label="Service Hub in numbers">
            <li><strong>{{ s.providers }}</strong><span>approved providers</span></li>
            <li><strong>{{ s.categories }}</strong><span>service categories</span></li>
            <li><strong>{{ s.completedBookings }}</strong><span>jobs completed</span></li>
            <li><strong>{{ s.reviews ? (s.avgRating | number: '1.1-1') + ' ★' : 'New' }}</strong><span>{{ s.reviews ? 'average from ' + s.reviews + ' reviews' : 'be the first to review' }}</span></li>
          </ul>
        </div>
      }
    </section>

    <!-- ===== Categories ===== -->
    <section class="container section">
      <div class="section-head">
        <div class="stack-xs"><span class="eyebrow">Popular right now</span><h2 class="h2-lg">Browse by category</h2></div>
        <a routerLink="/services" class="link-arrow">View all services <app-icon name="arrow" [size]="16" /></a>
      </div>
      <div class="grid cats">
        @for (c of categories(); track c.id) {
          <a class="card cat-card" [routerLink]="['/services']" [queryParams]="{ category: c.slug }">
            <span class="cat-ico"><app-icon [name]="catIcon(c.slug)" [size]="22" /></span>
            <strong>{{ c.name }}</strong>
            <span class="muted small">{{ c.serviceCount }} services</span>
          </a>
        }
      </div>
    </section>

    <!-- ===== Features with tabs ===== -->
    <section class="section-band">
      <div class="container stack-lg">
        <div class="center-head">
          <span class="eyebrow">Everything in one place</span>
          <h2 class="h2-lg">Powerful features for customers and providers</h2>
        </div>
        <div class="tabs center-tabs" role="tablist" aria-label="Feature groups">
          @for (t of featureTabs; track t.key) {
            <button type="button" role="tab" class="tab" [class.active]="tab() === t.key" [attr.aria-selected]="tab() === t.key" (click)="tab.set(t.key)">{{ t.label }}</button>
          }
        </div>
        <div class="grid feature-grid" role="tabpanel">
          @for (f of features(); track f.title) {
            <div class="card pad feature-card">
              <span class="feature-ico"><app-icon [name]="f.icon" [size]="22" /></span>
              <h3>{{ f.title }}</h3>
              <p class="muted">{{ f.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ===== Popular services ===== -->
    <section class="container section">
      <div class="section-head">
        <h2 class="h2-lg">Popular services</h2>
        <a routerLink="/services" class="link-arrow">See all <app-icon name="arrow" [size]="16" /></a>
      </div>
      @if (loading()) {
        <p class="muted">Loading services…</p>
      } @else {
        <div class="grid services">
          @for (s of services(); track s.id) { <app-service-card [service]="s" /> }
          @empty { <p class="muted">No services yet. Run the seed script to add demo data.</p> }
        </div>
      }
    </section>

    <!-- ===== Industries ===== -->
    <section class="container section">
      <div class="center-head">
        <span class="eyebrow">Industry solutions</span>
        <h2 class="h2-lg">Built for every kind of service business</h2>
      </div>
      <div class="grid industries">
        @for (i of industries; track i.slug) {
          <a class="card pad industry-card" [routerLink]="['/industries', i.slug]">
            <span class="feature-ico"><app-icon [name]="i.icon" [size]="22" /></span>
            <h3>{{ i.name }}</h3>
            <p class="muted small">{{ i.tagline }}</p>
            <span class="link-arrow small">Learn more <app-icon name="arrow" [size]="14" /></span>
          </a>
        }
      </div>
      <div class="center"><a routerLink="/industries" class="btn btn-outline">See all industries</a></div>
    </section>

    <!-- ===== Alternating rows ===== -->
    <section class="section-band">
      <div class="container stack-xl">
        <div class="alt-row">
          <div class="stack">
            <span class="eyebrow">Smart scheduling</span>
            <h2 class="h2-lg">Only times that really work</h2>
            <p class="muted">Slots are built live from each provider's working hours, breaks and days off. Taken slots are greyed out, and the system makes sure two people can never book the same time.</p>
            <a routerLink="/how-it-works" class="link-arrow">How booking works <app-icon name="arrow" [size]="16" /></a>
          </div>
          <div class="mock card">
            <div class="mock-head"><strong>Thursday</strong><span class="muted small">09:00 – 18:00</span></div>
            <div class="mock-slots">
              <span class="mslot">09:00</span><span class="mslot off">10:00</span><span class="mslot">11:00</span><span class="mslot">12:00</span>
              <span class="mslot break">Break</span><span class="mslot">14:00</span><span class="mslot off">15:00</span><span class="mslot">16:00</span>
            </div>
          </div>
        </div>
        <div class="alt-row reverse">
          <div class="stack">
            <span class="eyebrow">Always in the loop</span>
            <h2 class="h2-lg">Track every booking, step by step</h2>
            <p class="muted">Each booking keeps a timeline of what happened and who did it, so customers and providers always see the same thing.</p>
            <a routerLink="/help/booking-statuses" class="link-arrow">What each status means <app-icon name="arrow" [size]="16" /></a>
          </div>
          <div class="mock card">
            <ol class="timeline">
              <li class="done"><strong>Booking requested</strong><span class="muted small">Today, 9:42 PM · by you</span></li>
              <li class="done"><strong>Confirmed</strong><span class="muted small">Today, 10:05 PM · by provider</span></li>
              <li class="todo"><strong>Completed</strong><span class="muted small">Waiting</span></li>
            </ol>
          </div>
        </div>
        <div class="alt-row">
          <div class="stack">
            <span class="eyebrow">For professionals</span>
            <h2 class="h2-lg">A dashboard that runs your day</h2>
            <p class="muted">Providers see today's schedule, new requests and monthly earnings at a glance, and manage services and hours without spreadsheets.</p>
            <a routerLink="/for-providers" class="link-arrow">Explore provider tools <app-icon name="arrow" [size]="16" /></a>
          </div>
          <div class="mock card mock-stats">
            <div><span class="muted small">Today</span><strong>3 jobs</strong></div>
            <div><span class="muted small">Pending</span><strong>2</strong></div>
            <div><span class="muted small">This month</span><strong>₹18,450</strong></div>
            <div><span class="muted small">Rating</span><strong>4.7 ★</strong></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Support ===== -->
    <section class="container section">
      <div class="support card pad-lg">
        <div class="stack">
          <span class="eyebrow">Support</span>
          <h2 class="h2-lg">Real help from real people</h2>
          <p class="muted">Questions about a booking or your provider account? Our team reads every message.</p>
          <div class="btn-row">
            <a routerLink="/contact" class="btn btn-primary">Talk to support</a>
            <a routerLink="/help" class="btn btn-outline">Visit the help center</a>
          </div>
        </div>
        <ul class="support-list">
          <li><app-icon name="help" /><div><strong>Help center</strong><span class="muted small">Step-by-step guides for customers and providers</span></div></li>
          <li><app-icon name="mail" /><div><strong>Contact form</strong><span class="muted small">Send us a message any time</span></div></li>
          <li><app-icon name="chat" /><div><strong>FAQ</strong><span class="muted small">Quick answers to common questions</span></div></li>
        </ul>
      </div>
    </section>

    <!-- ===== Testimonials (real reviews from the database) ===== -->
    @if (reviews().length) {
      <section class="section-band">
        <div class="container stack-lg">
          <div class="section-head">
            <div class="stack-xs"><span class="eyebrow">Reviews</span><h2 class="h2-lg">What customers say</h2></div>
            <div class="btn-row">
              <button type="button" class="btn btn-outline btn-sm" (click)="scrollReviews(-1)" aria-label="Previous reviews">‹</button>
              <button type="button" class="btn btn-outline btn-sm" (click)="scrollReviews(1)" aria-label="Next reviews">›</button>
            </div>
          </div>
          <div class="carousel" #carousel tabindex="0" aria-label="Customer reviews">
            @for (r of reviews(); track r.id) {
              <figure class="card pad review-card">
                <div class="stars-static" [attr.aria-label]="r.rating + ' out of 5 stars'">{{ '★'.repeat(r.rating) }}<span>{{ '★'.repeat(5 - r.rating) }}</span></div>
                <blockquote>“{{ r.comment }}”</blockquote>
                <figcaption>
                  <strong>{{ r.customerName }}</strong>
                  <span class="muted small">{{ r.serviceTitle }} · <a [routerLink]="['/providers', r.providerId]">{{ r.providerName }}</a></span>
                  <span class="muted small">{{ r.createdAt | date: 'd MMM y' }}</span>
                </figcaption>
              </figure>
            }
          </div>
        </div>
      </section>
    }

    <!-- ===== Provider CTA ===== -->
    <section class="container section">
      <div class="cta-band">
        <div class="stack">
          <h2 class="h2-lg light">Grow your service business with Service Hub</h2>
          <p>Get booking requests online, keep your calendar in order and build your reputation with reviews.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-light" routerLink="/register" [queryParams]="{ role: 'provider' }">Become a provider</a>
          <a class="btn btn-ghost-light" routerLink="/pricing">See plans</a>
        </div>
      </div>
    </section>

    <app-newsletter />

    <!-- ===== FAQ ===== -->
    <section class="container section narrow-center">
      <div class="center-head"><span class="eyebrow">FAQ</span><h2 class="h2-lg">Frequently asked questions</h2></div>
      <app-faq-list [items]="faqs" />
      <div class="center"><a routerLink="/faq" class="link-arrow">See all questions <app-icon name="arrow" [size]="16" /></a></div>
    </section>
  `,
})
export class Home implements OnInit {
  private data = inject(DataService);
  private router = inject(Router);
  private carousel = viewChild<ElementRef<HTMLElement>>('carousel');

  protected categories = signal<Category[]>([]);
  protected services = signal<ServiceItem[]>([]);
  protected reviews = signal<SiteReview[]>([]);
  protected stats = signal<SiteStats | null>(null);
  protected loading = signal(true);
  protected view = signal<HeroView>('customer');
  protected tab = signal<FeatureTab>('booking');
  protected features = computed(() => FEATURES[this.tab()]);
  protected industries = INDUSTRIES;
  protected faqs = [...FAQ_GROUPS[0].items.slice(0, 4), ...FAQ_GROUPS[1].items.slice(0, 2)];
  protected search = inject(FormBuilder).nonNullable.group({ q: '', city: '' });
  protected featureTabs: { key: FeatureTab; label: string }[] = [
    { key: 'booking', label: 'Booking' }, { key: 'tracking', label: 'Tracking' }, { key: 'providers', label: 'For providers' }, { key: 'trust', label: 'Trust & safety' },
  ];
  protected mockRequests = [
    { name: 'Rahul M. · AC gas refill', when: 'Sat, 3:00 PM' },
    { name: 'Anita K. · Split AC service', when: 'Mon, 10:00 AM' },
  ];

  ngOnInit() {
    this.data.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    this.data.services({ limit: 8 }).subscribe({
      next: (r) => { this.services.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.data.siteStats().subscribe({ next: (s) => this.stats.set(s), error: () => {} });
    this.data.siteReviews(8).subscribe({ next: (r) => this.reviews.set(r), error: () => {} });
  }

  go() {
    const { q, city } = this.search.getRawValue();
    this.router.navigate(['/services'], { queryParams: { q: q || null, city: city || null } });
  }

  catIcon(slug: string) {
    const map: Record<string, string> = { cleaning: 'sparkle', plumbing: 'wrench', electrical: 'sparkle', 'salon-at-home': 'heart', 'ac-repair': 'home', painting: 'home' };
    return map[slug] ?? 'briefcase';
  }

  scrollReviews(dir: number) {
    const el = this.carousel()?.nativeElement;
    el?.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' });
  }
}
