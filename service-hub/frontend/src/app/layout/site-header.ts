import { Component, ElementRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { Category } from '../core/models';
import { INDUSTRIES } from '../content/site-content';
import { Icon } from '../shared/icon';

interface MenuLink { label: string; link: string; query?: Record<string, string>; fragment?: string; desc?: string; icon?: string; }
interface MenuColumn { title: string; links: MenuLink[]; }
interface MenuPromo { title: string; text: string; cta: string; link: string; query?: Record<string, string>; }
interface Menu { id: string; label: string; columns: MenuColumn[]; promo?: MenuPromo; footer?: MenuLink; wide?: boolean; }

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <header class="site-header" [class.scrolled]="scrolled()">
      <div class="container header-row">
        <a routerLink="/" class="brand" aria-label="Service Hub home">
          <span class="brand-mark" aria-hidden="true"><app-icon name="calendar" [size]="20" /></span>
          Service Hub
        </a>

        <nav class="mega-nav" [class.open]="mobileOpen()" aria-label="Main">
          <ul class="mega-list">
            @for (m of menus(); track m.id) {
              <li class="mega-item" (mouseenter)="hoverOpen(m.id)" (mouseleave)="hoverClose()">
                <button type="button" class="mega-trigger" [class.active]="openId() === m.id"
                  [attr.aria-expanded]="openId() === m.id" [attr.aria-controls]="'menu-' + m.id" (click)="toggle(m.id)">
                  {{ m.label }} <app-icon name="chevron" [size]="16" class="chev" />
                </button>
                @if (openId() === m.id) {
                  <div class="mega-panel" [class.wide]="m.wide" [id]="'menu-' + m.id">
                    <div class="mega-cols">
                      @for (col of m.columns; track col.title) {
                        <div class="mega-col">
                          <span class="mega-col-title">{{ col.title }}</span>
                          <ul>
                            @for (l of col.links; track l.label) {
                              <li>
                                <a [routerLink]="l.link" [queryParams]="l.query" [fragment]="l.fragment" class="mega-link" (click)="closeAll()">
                                  @if (l.icon) { <span class="mega-ico"><app-icon [name]="l.icon" [size]="18" /></span> }
                                  <span>
                                    <strong>{{ l.label }}</strong>
                                    @if (l.desc) { <span class="mega-desc">{{ l.desc }}</span> }
                                  </span>
                                </a>
                              </li>
                            }
                          </ul>
                        </div>
                      }
                      @if (m.promo; as p) {
                        <div class="mega-promo">
                          <strong>{{ p.title }}</strong>
                          <p>{{ p.text }}</p>
                          <a class="btn btn-primary btn-sm" [routerLink]="p.link" [queryParams]="p.query" (click)="closeAll()">{{ p.cta }}</a>
                        </div>
                      }
                    </div>
                    @if (m.footer; as f) {
                      <a class="mega-footer" [routerLink]="f.link" [queryParams]="f.query" (click)="closeAll()">{{ f.label }} <app-icon name="arrow" [size]="16" /></a>
                    }
                  </div>
                }
              </li>
            }
            <li class="mega-item"><a routerLink="/pricing" routerLinkActive="active" class="mega-trigger plain" (click)="closeAll()">Pricing</a></li>
          </ul>

          <div class="nav-actions">
            @if (auth.user(); as u) {
              @switch (u.role) {
                @case ('customer') { <a routerLink="/bookings" class="nav-link" (click)="closeAll()">My bookings</a> }
                @case ('provider') { <a routerLink="/provider" class="nav-link" (click)="closeAll()">Provider portal</a> }
                @case ('admin') { <a routerLink="/admin" class="nav-link" (click)="closeAll()">Admin console</a> }
              }
              <a routerLink="/notifications" class="nav-link bell" (click)="closeAll()" [attr.aria-label]="'Notifications' + (unread() ? ', ' + unread() + ' unread' : '')">
                <app-icon name="bell" [size]="20" />
                @if (unread() > 0) { <span class="count">{{ unread() }}</span> }
              </a>
              <button type="button" class="btn btn-outline btn-sm" (click)="auth.logout()">Log out</button>
            } @else {
              <a routerLink="/login" class="nav-link" (click)="closeAll()">Log in</a>
              <a routerLink="/register" class="btn btn-primary btn-sm" (click)="closeAll()">Sign up free</a>
            }
          </div>
        </nav>

        <button type="button" class="burger" (click)="mobileOpen.set(!mobileOpen())" [attr.aria-expanded]="mobileOpen()" aria-label="Menu">
          <app-icon [name]="mobileOpen() ? 'close' : 'menu'" [size]="22" />
        </button>
      </div>
    </header>
    @if (openId() && !mobileOpen()) { <div class="mega-backdrop" (click)="closeAll()" aria-hidden="true"></div> }
  `,
})
export class SiteHeader implements OnInit {
  protected auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  protected openId = signal<string | null>(null);
  protected mobileOpen = signal(false);
  protected scrolled = signal(false);
  protected unread = signal(0);
  private categories = signal<Category[]>([]);
  private hoverTimer?: ReturnType<typeof setTimeout>;

  protected menus = computed<Menu[]>(() => {
    const cats = this.categories();
    const half = Math.ceil(cats.length / 2) || 1;
    const catLink = (c: Category): MenuLink => ({ label: c.name, link: '/services', query: { category: c.slug }, desc: `${c.serviceCount ?? 0} services` });
    return [
      {
        id: 'services', label: 'Services', wide: true,
        columns: cats.length
          ? [{ title: 'Popular categories', links: cats.slice(0, half).map(catLink) }, { title: 'More categories', links: cats.slice(half).map(catLink) }]
          : [{ title: 'Services', links: [{ label: 'Browse all services', link: '/services' }] }],
        promo: { title: 'Need help today?', text: 'Pick a service and see free time slots for today and the next two weeks.', cta: 'Find a slot', link: '/services' },
        footer: { label: 'View all services', link: '/services' },
      },
      {
        id: 'industries', label: 'Industries',
        columns: [{ title: 'Who uses Service Hub', links: INDUSTRIES.map((i) => ({ label: i.name, link: `/industries/${i.slug}`, icon: i.icon, desc: i.tagline })) }],
        footer: { label: 'All industries', link: '/industries' },
      },
      {
        id: 'providers', label: 'For providers', wide: true,
        columns: [
          { title: 'Grow your business', links: [
            { label: 'Why join Service Hub', link: '/for-providers', icon: 'briefcase', desc: 'Get bookings without phone calls' },
            { label: 'Plans & pricing', link: '/pricing', icon: 'rupee', desc: 'Start free, upgrade anytime' },
            { label: 'Join as a provider', link: '/register', query: { role: 'provider' }, icon: 'users', desc: 'Create your account in minutes' },
          ] },
          { title: 'Tools you get', links: [
            { label: 'Smart booking calendar', link: '/for-providers', fragment: 'calendar', icon: 'calendar' },
            { label: 'Booking requests', link: '/for-providers', fragment: 'requests', icon: 'bell' },
            { label: 'Earnings dashboard', link: '/for-providers', fragment: 'dashboard', icon: 'chart' },
            { label: 'Ratings & reviews', link: '/for-providers', fragment: 'reviews', icon: 'star' },
          ] },
        ],
        promo: { title: 'Free to start', text: 'List up to 3 services on the Starter plan and take your first bookings this week.', cta: 'Become a provider', link: '/register', query: { role: 'provider' } },
      },
      {
        id: 'resources', label: 'Resources', wide: true,
        columns: [
          { title: 'Get help', links: [
            { label: 'Help center', link: '/help', icon: 'help' },
            { label: 'FAQ', link: '/faq', icon: 'chat' },
            { label: 'Contact support', link: '/contact', icon: 'mail' },
          ] },
          { title: 'Learn', links: [
            { label: 'How it works', link: '/how-it-works', icon: 'list' },
            { label: 'Blog', link: '/blog', icon: 'book' },
            { label: 'Trust & safety', link: '/safety', icon: 'shield' },
          ] },
          { title: 'Company', links: [
            { label: 'About us', link: '/about', icon: 'heart' },
            { label: 'Terms of service', link: '/terms', icon: 'list' },
            { label: 'Privacy policy', link: '/privacy', icon: 'lock' },
          ] },
        ],
      },
    ];
  });

  ngOnInit() {
    this.data.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    if (this.auth.isLoggedIn()) this.data.notifications().subscribe({ next: (n) => this.unread.set(n.unread), error: () => {} });
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.closeAll());
  }

  toggle(id: string) { this.openId.set(this.openId() === id ? null : id); }

  hoverOpen(id: string) {
    if (this.mobileOpen() || !matchMedia('(hover: hover)').matches) return;
    clearTimeout(this.hoverTimer);
    this.openId.set(id);
  }

  hoverClose() {
    if (this.mobileOpen() || !matchMedia('(hover: hover)').matches) return;
    clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => this.openId.set(null), 180);
  }

  closeAll() {
    this.openId.set(null);
    this.mobileOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    const id = this.openId();
    if (!id) return;
    this.openId.set(null);
    (this.host.nativeElement.querySelector(`[aria-controls="menu-${id}"]`) as HTMLElement | null)?.focus();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target as Node)) this.openId.set(null);
  }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 8); }
}
