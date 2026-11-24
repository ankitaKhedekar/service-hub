import { Routes } from '@angular/router';
import { PortalShell, NavItem } from '../../layout/portal-shell';

const NAV: NavItem[] = [
  { label: 'Dashboard', link: '/provider', exact: true },
  { label: 'Bookings', link: '/provider/bookings' },
  { label: 'My services', link: '/provider/services' },
  { label: 'Availability', link: '/provider/availability' },
  { label: 'Profile', link: '/provider/profile' },
];

export const PROVIDER_ROUTES: Routes = [
  {
    path: '',
    component: PortalShell,
    // route data is bound to PortalShell's inputs (withComponentInputBinding)
    data: { subtitle: 'Provider portal', items: NAV, dark: true },
    children: [
      { path: '', loadComponent: () => import('./provider-dashboard').then((m) => m.ProviderDashboard), title: 'Dashboard | Provider' },
      { path: 'bookings', loadComponent: () => import('./provider-bookings').then((m) => m.ProviderBookings), title: 'Bookings | Provider' },
      { path: 'services', loadComponent: () => import('./provider-services').then((m) => m.ProviderServices), title: 'My services | Provider' },
      { path: 'availability', loadComponent: () => import('./provider-availability').then((m) => m.ProviderAvailability), title: 'Availability | Provider' },
      { path: 'profile', loadComponent: () => import('./provider-profile').then((m) => m.ProviderProfile), title: 'Profile | Provider' },
    ],
  },
];
