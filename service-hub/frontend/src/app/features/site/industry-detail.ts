import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';
import { ServiceCard } from '../../shared/service-card';
import { DataService } from '../../core/data.service';
import { ServiceItem } from '../../core/models';
import { INDUSTRIES } from '../../content/site-content';

@Component({
  selector: 'app-industry-detail',
  imports: [PageHero, Icon, ServiceCard, RouterLink],
  template: `
    @if (industry(); as i) {
      <app-page-hero [eyebrow]="'Industries / ' + i.name" [title]="i.tagline" [lead]="i.intro">
        <div class="btn-row">
          <a routerLink="/services" [queryParams]="i.categorySlugs.length ? { category: i.categorySlugs[0] } : {}" class="btn btn-primary">Book a service</a>
          <a routerLink="/register" [queryParams]="{ role: 'provider' }" class="btn btn-outline">List your business</a>
        </div>
      </app-page-hero>

      <section class="container section">
        <h2 class="h2-lg">Popular services in {{ i.name.toLowerCase() }}</h2>
        <ul class="tag-list large">@for (e of i.examples; track e) { <li>{{ e }}</li> }</ul>
      </section>

      <section class="section-band">
        <div class="container stack-lg">
          <h2 class="h2-lg">Why {{ i.name.toLowerCase() }} professionals use Service Hub</h2>
          <div class="grid three">
            @for (b of i.benefits; track b.title) {
              <div class="card pad feature-card">
                <span class="feature-ico"><app-icon name="check" [size]="22" /></span>
                <h3>{{ b.title }}</h3>
                <p class="muted">{{ b.text }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="container section">
        <h2 class="h2-lg">Available now</h2>
        <div class="grid services">
          @for (s of services(); track s.id) { <app-service-card [service]="s" /> }
          @empty {
            <div class="card pad empty">No {{ i.name.toLowerCase() }} providers are listed yet. <a routerLink="/register" [queryParams]="{ role: 'provider' }">Be the first to join</a>.</div>
          }
        </div>
      </section>
    } @else {
      <div class="container page narrow center stack">
        <h1>Industry not found</h1>
        <a routerLink="/industries" class="btn btn-primary">See all industries</a>
      </div>
    }
  `,
})
export class IndustryDetail {
  readonly slug = input.required<string>();
  private data = inject(DataService);
  private title = inject(Title);
  protected industry = computed(() => INDUSTRIES.find((i) => i.slug === this.slug()));
  protected services = signal<ServiceItem[]>([]);

  constructor() {
    effect(() => {
      const i = this.industry();
      this.services.set([]);
      if (!i) return;
      this.title.setTitle(`${i.name} | Service Hub`);
      for (const cat of i.categorySlugs.slice(0, 3)) {
        this.data.services({ category: cat, limit: 4 }).subscribe({ next: (r) => this.services.update((list) => [...list, ...r.items].slice(0, 8)), error: () => {} });
      }
    });
  }
}
