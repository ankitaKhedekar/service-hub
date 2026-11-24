import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

/** Header + page + footer for every public and customer page. */
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <app-site-header />
    <main id="main" tabindex="-1"><router-outlet /></main>
    <app-site-footer />
  `,
})
export class PublicLayout {}
