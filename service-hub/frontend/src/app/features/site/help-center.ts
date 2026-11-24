import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';
import { HELP_ARTICLES, HELP_TOPICS } from '../../content/site-content';

@Component({
  selector: 'app-help-center',
  imports: [PageHero, Icon, RouterLink],
  template: `
    <app-page-hero eyebrow="Help center" title="How can we help?" lead="Guides for booking, managing bookings and running your provider account.">
      <div class="help-search">
        <label for="help-q" class="sr-only">Search help articles</label>
        <app-icon name="search" [size]="20" />
        <input id="help-q" type="search" placeholder="Search, e.g. cancel, slots, approval" [value]="q()" (input)="q.set($any($event.target).value)" />
      </div>
    </app-page-hero>

    <section class="container section">
      @if (q()) {
        <h2>{{ results().length }} result{{ results().length === 1 ? '' : 's' }} for "{{ q() }}"</h2>
        <div class="stack">
          @for (a of results(); track a.slug) {
            <a class="card pad article-row" [routerLink]="['/help', a.slug]"><strong>{{ a.title }}</strong><span class="muted small">{{ a.summary }}</span></a>
          } @empty { <div class="card pad empty">No articles match. Try another word or <a routerLink="/contact">contact support</a>.</div> }
        </div>
      } @else {
        <div class="grid help-topics">
          @for (t of topics; track t.id) {
            <section class="card pad stack">
              <div class="row-start"><span class="feature-ico"><app-icon [name]="t.icon" [size]="22" /></span><h2 class="h3">{{ t.title }}</h2></div>
              <ul class="link-list">
                @for (a of byTopic(t.id); track a.slug) { <li><a [routerLink]="['/help', a.slug]">{{ a.title }}</a></li> }
              </ul>
            </section>
          }
        </div>
      }
    </section>

    <section class="container section">
      <div class="support card pad-lg">
        <div class="stack"><h2 class="h2-lg">Still need help?</h2><p class="muted">Send us a message and our team will get back to you.</p></div>
        <div class="btn-row"><a routerLink="/contact" class="btn btn-primary">Contact support</a><a routerLink="/faq" class="btn btn-outline">Read the FAQ</a></div>
      </div>
    </section>
  `,
})
export class HelpCenter {
  protected topics = HELP_TOPICS;
  protected q = signal('');
  protected results = computed(() => {
    const q = this.q().trim().toLowerCase();
    return HELP_ARTICLES.filter((a) => [a.title, a.summary, ...a.body, ...(a.steps ?? [])].join(' ').toLowerCase().includes(q));
  });

  byTopic(id: string) { return HELP_ARTICLES.filter((a) => a.topic === id); }
}
