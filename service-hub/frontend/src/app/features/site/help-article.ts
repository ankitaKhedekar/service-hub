import { Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HELP_ARTICLES, HELP_TOPICS } from '../../content/site-content';

@Component({
  selector: 'app-help-article',
  imports: [RouterLink],
  template: `
    <div class="container page narrow">
      @if (article(); as a) {
        <nav class="crumbs small" aria-label="Breadcrumb"><a routerLink="/help">Help center</a> / <span>{{ topicName() }}</span></nav>
        <article class="card pad-lg stack prose">
          <h1>{{ a.title }}</h1>
          <p class="lead-sm">{{ a.summary }}</p>
          @if (a.steps) {
            <ol class="numbered">@for (s of a.steps; track s) { <li>{{ s }}</li> }</ol>
          }
          @for (p of a.body; track p) { <p>{{ p }}</p> }
        </article>
        <section class="stack">
          <h2>Related articles</h2>
          <ul class="link-list">@for (r of related(); track r.slug) { <li><a [routerLink]="['/help', r.slug]">{{ r.title }}</a></li> }</ul>
          <p class="muted small">Didn't find what you need? <a routerLink="/contact">Contact support</a>.</p>
        </section>
      } @else {
        <div class="center stack"><h1>Article not found</h1><a routerLink="/help" class="btn btn-primary">Back to the help center</a></div>
      }
    </div>
  `,
})
export class HelpArticlePage {
  readonly slug = input.required<string>();
  private title = inject(Title);
  protected article = computed(() => HELP_ARTICLES.find((a) => a.slug === this.slug()));
  protected topicName = computed(() => HELP_TOPICS.find((t) => t.id === this.article()?.topic)?.title ?? '');
  protected related = computed(() => HELP_ARTICLES.filter((a) => a.topic === this.article()?.topic && a.slug !== this.slug()).concat(
    HELP_ARTICLES.filter((a) => a.topic !== this.article()?.topic)).slice(0, 4));

  constructor() {
    effect(() => { const a = this.article(); if (a) this.title.setTitle(`${a.title} | Help | Service Hub`); });
  }
}
