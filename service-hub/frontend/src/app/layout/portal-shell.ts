import { Component, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

export interface NavItem { label: string; link: string; exact?: boolean; }

/** Side-menu layout shared by the provider portal and the admin console. */
@Component({
  selector: 'app-portal-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="portal" [class.portal-dark]="dark()">
      <aside class="portal-side">
        <div class="portal-brand">
          <a routerLink="/" class="brand-text">Service Hub</a>
          <span class="portal-sub">{{ subtitle() }}</span>
        </div>
        <button type="button" class="menu-btn portal-menu-btn" (click)="open.set(!open())" [attr.aria-expanded]="open()">Menu</button>
        <nav class="portal-nav" [class.open]="open()" [attr.aria-label]="subtitle()" (click)="open.set(false)">
          @for (item of items(); track item.link) {
            <a [routerLink]="item.link" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exact }">{{ item.label }}</a>
          }
          <a routerLink="/notifications">Notifications</a>
          <button type="button" class="portal-logout" (click)="auth.logout()">Log out</button>
        </nav>
      </aside>
      <main class="portal-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PortalShell {
  readonly subtitle = input('');
  readonly items = input<NavItem[]>([]);
  readonly dark = input(false);
  protected auth = inject(AuthService);
  protected open = signal(false);
}
