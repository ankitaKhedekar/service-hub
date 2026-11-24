import { Component, computed, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BLOG_POSTS } from '../../content/site-content';

@Component({
  selector: 'app-blog-post',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container page narrow">
      @if (post(); as p) {
        <nav class="crumbs small" aria-label="Breadcrumb"><a routerLink="/blog">Blog</a> / <span>{{ p.tag }}</span></nav>
        <article class="stack prose">
          <h1 class="display-sm">{{ p.title }}</h1>
          <span class="muted small">{{ p.date | date: 'd MMMM y' }} · {{ p.readMinutes }} min read</span>
          <p class="lead-sm">{{ p.excerpt }}</p>
          @for (para of p.body; track para) { <p>{{ para }}</p> }
        </article>
        <div class="cta-band small-band">
          <strong class="light">Ready to book?</strong>
          <a routerLink="/services" class="btn btn-light">Browse services</a>
        </div>
        <section class="stack">
          <h2>More from the blog</h2>
          <ul class="link-list">@for (o of others(); track o.slug) { <li><a [routerLink]="['/blog', o.slug]">{{ o.title }}</a></li> }</ul>
        </section>
      } @else {
        <div class="center stack"><h1>Post not found</h1><a routerLink="/blog" class="btn btn-primary">Back to the blog</a></div>
      }
    </div>
  `,
})
export class BlogPostPage {
  readonly slug = input.required<string>();
  private title = inject(Title);
  protected post = computed(() => BLOG_POSTS.find((p) => p.slug === this.slug()));
  protected others = computed(() => BLOG_POSTS.filter((p) => p.slug !== this.slug()));

  constructor() {
    effect(() => { const p = this.post(); if (p) this.title.setTitle(`${p.title} | Service Hub Blog`); });
  }
}
