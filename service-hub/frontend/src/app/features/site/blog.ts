import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { BLOG_POSTS } from '../../content/site-content';

@Component({
  selector: 'app-blog',
  imports: [PageHero, RouterLink, DatePipe],
  template: `
    <app-page-hero eyebrow="Blog" title="Tips for a well-kept home and a growing business" lead="Practical advice for customers and service professionals." />
    <section class="container section">
      <div class="grid blog-grid">
        @for (p of posts; track p.slug) {
          <a class="card blog-card" [routerLink]="['/blog', p.slug]">
            <div class="blog-cover"><span class="chip">{{ p.tag }}</span></div>
            <div class="pad stack-xs">
              <span class="muted small">{{ p.date | date: 'd MMM y' }} · {{ p.readMinutes }} min read</span>
              <h2 class="h3">{{ p.title }}</h2>
              <p class="muted small">{{ p.excerpt }}</p>
            </div>
          </a>
        }
      </div>
    </section>
  `,
})
export class Blog {
  protected posts = BLOG_POSTS;
}
