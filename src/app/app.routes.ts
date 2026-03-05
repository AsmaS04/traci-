import { Routes } from '@angular/router';
import { LoginAdmin }    from './pages/login-admin/login-admin';
import { LoginClient }   from './pages/login-client/login-client';
import { LoginReseller } from './pages/login-reseller/login-reseller';
import { AdminLayout }   from './pages/admin/admin-layout/admin-layout';
import ClientLayout from './pages/client/client-layout/client-layout';

export const routes: Routes = [

  // DEFAULT → client dashboard
  {
    path: '',
    redirectTo: 'client-dashboard/dashboard',
    pathMatch: 'full'
  },

  // ══════════════════════════════════════════════════════════
  // ADMIN SHELL (sidebar + router-outlet)
  // ══════════════════════════════════════════════════════════
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'resellers',
        loadComponent: () =>
          import('./features/admin/resellers/resellers').then(m => m.Resellers),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/admin/clients/clients').then(m => m.Clients),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ══════════════════════════════════════════════════════════
  // CLIENT SHELL (sidebar + router-outlet)
  // ══════════════════════════════════════════════════════════
  {
    path: 'client-dashboard',
    component: ClientLayout,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/client/dashboard/dashboard').then(m => m.default),
      },
      {
        path: 'abonnements',
        loadComponent: () =>
          import('./features/client/abonnements/abonnements').then(m => m.default),
      },
      {
        path: 'factures',
        loadComponent: () =>
          import('./features/client/factures/factures').then(m => m.default),
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./features/client/profil/profil').then(m => m.default),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ══════════════════════════════════════════════════════════
  // RESELLER PAGES
  // ══════════════════════════════════════════════════════════
  {
    path: 'reseller-dashboard',
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/reseller/dashboard/dashboard').then(m => m.default),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/reseller/client/client').then(m => m.default),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ══════════════════════════════════════════════════════════
  // LOGIN PAGES (public, no sidebar)
  // ══════════════════════════════════════════════════════════
  { path: 'client',             component: LoginClient },
  { path: 'bo-admin-access',    component: LoginAdmin },
  { path: 'bo-reseller-access', component: LoginReseller },

];
