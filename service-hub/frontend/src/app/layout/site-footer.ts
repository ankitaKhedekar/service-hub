import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data.service';
import { Category } from '../core/models';
import { INDUSTRIES } from '../content/site-content';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, Icon],
  template: `
    <footer class="big-footer">
      <div class="container">
        <div class="footer-cta">
          <div>
            <strong class="footer-title">Are you a service professional?</strong>
            <p>List your services, set your hours and start getting bookings.</p>
          </div>
          <div class="btn-row">
            <a class="btn btn-light" routerLink="/register" [queryParams]="{ role: 'provider' }">Join as a provider</a>
            <a class="btn btn-ghost-light" routerLink="/for-providers">Learn more</a>
          </div>
        </div>

        <div class="footer-grid">
          <div class="footer-brand">
            <a routerLink="/" class="brand light"><span class="brand-mark" aria-hidden="true"><app-icon name="calendar" [size]="18" /></span>Service Hub</a>
            <p>Book trusted local professionals and track every booking from request to completion.</p>
          </div>
          <nav aria-label="Services">
            <span class="footer-head">Services</span>
            @for (c of categories(); track c.id) { <a routerLink="/services" [queryParams]="{ category: c.slug }">{{ c.name }}</a> }
            <a routerLink="/services">All services</a>
          </nav>
          <nav aria-label="Industries">
            <span class="footer-head">Industries</span>
            @for (i of industries; track i.slug) { <a [routerLink]="['/industries', i.slug]">{{ i.name }}</a> }
          </nav>
          <nav aria-label="For providers">
            <span class="footer-head">For providers</span>
            <a routerLink="/for-providers">Why join</a>
            <a routerLink="/pricing">Plans &amp; pricing</a>
            <a routerLink="/register" [queryParams]="{ role: 'provider' }">Become a provider</a>
            <a routerLink="/help/become-provider">Provider guide</a>
            <a routerLink="/login">Provider login</a>
          </nav>
          <nav aria-label="Help">
            <span class="footer-head">Help</span>
            <a routerLink="/help">Help center</a>
            <a routerLink="/faq">FAQ</a>
            <a routerLink="/how-it-works">How it works</a>
            <a routerLink="/contact">Contact us</a>
            <a routerLink="/safety">Trust &amp; safety</a>
          </nav>
          <nav aria-label="Company">
            <span class="footer-head">Company</span>
            <a routerLink="/about">About us</a>
            <a routerLink="/blog">Blog</a>
            <a routerLink="/terms">Terms of service</a>
            <a routerLink="/privacy">Privacy policy</a>
          </nav>
        </div>

        <div class="footer-bottom">
          <span>© {{ year }} Service Hub. All rights reserved.</span>
          <span>Made with Angular, Node.js and MongoDB</span>
        </div>
      </div>
    </footer>
  `,
})
export class SiteFooter implements OnInit {
  private data = inject(DataService);
  protected categories = signal<Category[]>([]);
  protected industries = INDUSTRIES;
  protected year = new Date().getFullYear();

  ngOnInit() {
    this.data.categories().subscribe({ next: (c) => this.categories.set(c.slice(0, 7)), error: () => {} });
  }
}
