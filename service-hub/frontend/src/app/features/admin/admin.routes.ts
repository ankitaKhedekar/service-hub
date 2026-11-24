import { Routes } from '@angular/router';
import { PortalShell, NavItem } from '../../layout/portal-shell';

const NAV: NavItem[] = [
  { label: 'Dashboard', link: '/admin', exact: true },
  { label: 'Provider approvals', link: '/admin/providers' },
  { label: 'Categories', link: '/admin/categories' },
  { label: 'Services', link: '/admin/services' },
  { label: 'Bookings', link: '/admin/bookings' },
  { label: 'Users', link: '/admin/users' },
  { label: 'Messages', link: '/admin/messages' },
];

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: PortalShell,
    data: { subtitle: 'Admin console', items: NAV, dark: false },
    children: [
      { path: '', loadComponent: () => import('./admin-dashboard').then((m) => m.AdminDashboard), title: 'Dashboard | Admin' },
      { path: 'providers', loadComponent: () => import('./admin-providers').then((m) => m.AdminProviders), title: 'Providers | Admin' },
      { path: 'categories', loadComponent: () => import('./admin-categories').then((m) => m.AdminCategories), title: 'Categories | Admin' },
      { path: 'services', loadComponent: () => import('./admin-services').then((m) => m.AdminServices), title: 'Services | Admin' },
      { path: 'bookings', loadComponent: () => import('./admin-bookings').then((m) => m.AdminBookings), title: 'Bookings | Admin' },
      { path: 'users', loadComponent: () => import('./admin-users').then((m) => m.AdminUsers), title: 'Users | Admin' },
      { path: 'messages', loadComponent: () => import('./admin-messages').then((m) => m.AdminMessages), title: 'Messages | Admin' },
    ],
  },
];
