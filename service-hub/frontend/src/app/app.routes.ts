import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { PublicLayout } from './layout/public-layout';

const page = (title: string) => `${title} | Service Hub`;

export const routes: Routes = [
  // ---------- Public website + customer area (mega-menu header + big footer) ----------
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', loadComponent: () => import('./features/public/home').then((m) => m.Home), title: 'Service Hub - Book trusted home services online' },
      { path: 'services', loadComponent: () => import('./features/public/service-list').then((m) => m.ServiceList), title: page('Services') },
      { path: 'services/:id', loadComponent: () => import('./features/public/service-detail').then((m) => m.ServiceDetail), title: page('Book a service') },
      { path: 'providers/:id', loadComponent: () => import('./features/public/provider-detail').then((m) => m.ProviderDetail), title: page('Provider') },

      // marketing and help pages
      { path: 'how-it-works', loadComponent: () => import('./features/site/how-it-works').then((m) => m.HowItWorks), title: page('How it works') },
      { path: 'for-providers', loadComponent: () => import('./features/site/for-providers').then((m) => m.ForProviders), title: page('For service providers') },
      { path: 'pricing', loadComponent: () => import('./features/site/pricing').then((m) => m.Pricing), title: page('Plans & pricing') },
      { path: 'industries', loadComponent: () => import('./features/site/industries').then((m) => m.Industries), title: page('Industries') },
      { path: 'industries/:slug', loadComponent: () => import('./features/site/industry-detail').then((m) => m.IndustryDetail), title: page('Industry') },
      { path: 'help', loadComponent: () => import('./features/site/help-center').then((m) => m.HelpCenter), title: page('Help center') },
      { path: 'help/:slug', loadComponent: () => import('./features/site/help-article').then((m) => m.HelpArticlePage), title: page('Help') },
      { path: 'faq', loadComponent: () => import('./features/site/faq').then((m) => m.FaqPage), title: page('FAQ') },
      { path: 'blog', loadComponent: () => import('./features/site/blog').then((m) => m.Blog), title: page('Blog') },
      { path: 'blog/:slug', loadComponent: () => import('./features/site/blog-post').then((m) => m.BlogPostPage), title: page('Blog') },
      { path: 'about', loadComponent: () => import('./features/site/about').then((m) => m.About), title: page('About us') },
      { path: 'contact', loadComponent: () => import('./features/site/contact').then((m) => m.Contact), title: page('Contact us') },
      { path: 'safety', loadComponent: () => import('./features/site/safety').then((m) => m.Safety), title: page('Trust & safety') },
      { path: 'terms', loadComponent: () => import('./features/site/legal').then((m) => m.Legal), data: { kind: 'terms' }, title: page('Terms of service') },
      { path: 'privacy', loadComponent: () => import('./features/site/legal').then((m) => m.Legal), data: { kind: 'privacy' }, title: page('Privacy policy') },

      // customer area
      { path: 'bookings', canActivate: [roleGuard('customer')], loadComponent: () => import('./features/customer/my-bookings').then((m) => m.MyBookings), title: page('My bookings') },
      { path: 'bookings/:id', canActivate: [authGuard], loadComponent: () => import('./features/customer/booking-detail').then((m) => m.BookingDetail), title: page('Booking') },
      { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./features/shared/notifications').then((m) => m.Notifications), title: page('Notifications') },
    ],
  },

  // ---------- Full-screen auth pages ----------
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login').then((m) => m.Login), title: page('Log in') },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register').then((m) => m.Register), title: page('Create account') },

  // ---------- Provider portal and admin console (lazy-loaded sections) ----------
  { path: 'provider', canActivate: [roleGuard('provider')], loadChildren: () => import('./features/provider/provider.routes').then((m) => m.PROVIDER_ROUTES) },
  { path: 'admin', canActivate: [roleGuard('admin')], loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },

  { path: '', component: PublicLayout, children: [
    { path: '**', loadComponent: () => import('./features/shared/not-found').then((m) => m.NotFound), title: page('Page not found') },
  ] },
];
