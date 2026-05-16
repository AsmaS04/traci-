import { Routes } from '@angular/router';
import { authGuard } from './guards/Auth.guard';

export const routes: Routes = [

  { path: '', redirectTo: 'client', pathMatch: 'full' },

  // ── ADMIN ─────────────────────────────────────────────
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin-layout/admin-layout').then(m => m.AdminLayout),
    canActivate: [authGuard(['ROLE_ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'resellers',    loadComponent: () => import('./features/admin/resellers/resellers').then(m => m.Resellers) },
      { path: 'clients',      loadComponent: () => import('./features/admin/clients/clients').then(m => m.Clients) },
      { path: 'devices',      loadComponent: () => import('./features/admin/devices/devices').then(m => m.AdminDevices) },
      { path: 'profil',       loadComponent: () => import('./features/admin/profile/profile').then(m => m.AdminProfil) },
      { path: 'events',       loadComponent: () => import('./features/admin/events/events').then(m => m.EventsComponent) },
      { path: 'transactions', loadComponent: () => import('./features/admin/transactions/transaction').then(m => m.Transactions) },
    ]
  },

  // ── CLIENT ────────────────────────────────────────────
  {
    path: 'client-dashboard',
    loadComponent: () =>
      import('./pages/client/client-layout/client-layout').then(m => m.default),
    canActivate: [authGuard(['ROLE_CLIENT'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./features/client/dashboard/dashboard').then(m => m.default) },
      { path: 'abonnements',  loadComponent: () => import('./features/client/abonnements/abonnements').then(m => m.default) },
      { path: 'devices',      loadComponent: () => import('./features/client/devices/devices').then(m => m.default) },
      { path: 'factures',     loadComponent: () => import('./features/client/factures/factures').then(m => m.default) },
      { path: 'profil',       loadComponent: () => import('./features/client/profil/profil').then(m => m.default) },
    ]
  },

  // ── RESELLER ──────────────────────────────────────────
  {
    path: 'reseller-dashboard',
    loadComponent: () =>
      import('./pages/reseller/reseller-layout/reseller-layout').then(m => m.default),
    canActivate: [authGuard(['ROLE_RESELLER'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./features/reseller/dashboard/dashboard').then(m => m.default) },
      { path: 'clients',      loadComponent: () => import('./features/reseller/client/client').then(m => m.default) },
      { path: 'devices',      loadComponent: () => import('./features/reseller/devices/devices').then(m => m.default) },
      { path: 'profile',      loadComponent: () => import('./features/reseller/profile/profile').then(m => m.default) },
    ]
  },

  // ── LOGIN PAGES ───────────────────────────────────────
  { path: 'client',             loadComponent: () => import('./pages/login-client/login-client').then(m => m.LoginClient) },
  { path: 'bo-admin-access',    loadComponent: () => import('./pages/login-admin/login-admin').then(m => m.LoginAdmin) },
  { path: 'bo-reseller-access', loadComponent: () => import('./pages/login-reseller/login-reseller').then(m => m.LoginReseller) },
  { path: 'request-access',     loadComponent: () => import('./pages/request_access/request_access').then(m => m.default) },

];