import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';
import { INDUSTRIES } from '../../content/site-content';

@Component({
  selector: 'app-industries',
  imports: [PageHero, Icon, RouterLink],
  template: `
    <app-page-hero eyebrow="Industries" title="One booking platform for many kinds of services" lead="Whatever you offer, customers can find you, see your free slots and book online." />
    <section class="container section">
      <div class="grid industries">
        @for (i of industries; track i.slug) {
          <a class="card pad industry-card" [routerLink]="['/industries', i.slug]">
            <span class="feature-ico"><app-icon [name]="i.icon" [size]="22" /></span>
            <h2 class="h3">{{ i.name }}</h2>
            <p class="muted small">{{ i.tagline }}</p>
            <ul class="tag-list">@for (e of i.examples.slice(0, 4); track e) { <li>{{ e }}</li> }</ul>
            <span class="link-arrow small">Learn more <app-icon name="arrow" [size]="14" /></span>
          </a>
        }
      </div>
    </section>
  `,
})
export class Industries {
  protected industries = INDUSTRIES;
}
