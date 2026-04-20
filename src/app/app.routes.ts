import { Routes } from '@angular/router';
import { LoginAdmin }    from './pages/login-admin/login-admin';
import { LoginClient }   from './pages/login-client/login-client';
import { LoginReseller } from './pages/login-reseller/login-reseller';
import { AdminLayout }   from './pages/admin/admin-layout/admin-layout';
import ClientLayout from './pages/client/client-layout/client-layout';
import { authGuard } from './guards/Auth.guard';

export const routes: Routes = [

  // DEFAULT → client login
  {
    path: '',
    redirectTo: 'client',
    pathMatch: 'full'
  },

  // ══════════════════════════════════════════════════════════
  // ADMIN SHELL
  // ══════════════════════════════════════════════════════════
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard(['ROLE_ADMIN'])],
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
        path: 'profil',
        loadComponent: () =>
          import('./features/admin/profile/profile').then(m => m.AdminProfil),
      },
      {
        path: 'devices',
        loadComponent: () =>
          import('./features/admin/devices/devices').then(m => m.AdminDevices),
      },
      // TRANSACTIONS — commented out until backend is ready
      // {
      //   path: 'transactions',
      //   loadComponent: () =>
      //     import('./features/admin/transactions/transaction').then(m => m.Transactions),
      // },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ══════════════════════════════════════════════════════════
  // CLIENT SHELL — commented out until pages are updated
  // ══════════════════════════════════════════════════════════
  {
    path: 'client-dashboard',
    component: ClientLayout,
    canActivate: [authGuard(['ROLE_CLIENT'])],
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
        path: 'devices',
        loadComponent: () =>
          import('./features/client/devices/devices').then(m => m.default),
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
  // // RESELLER SHELL — commented out until pages are updated
  // // ══════════════════════════════════════════════════════════
  {
    path: 'reseller-dashboard',
    loadComponent: () =>
      import('./pages/reseller/reseller-layout/reseller-layout').then(m => m.default),
    canActivate: [authGuard(['ROLE_RESELLER'])],
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
        path: 'devices',
        loadComponent: () =>
          import('./features/reseller/devices/devices').then(m => m.default),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/reseller/profile/profile').then(m => m.default),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
    // },

  //  ══════════════════════════════════════════════════════════
  // LOGIN PAGES
  // ══════════════════════════════════════════════════════════
  { path: 'client',             component: LoginClient },
  { path: 'bo-admin-access',    component: LoginAdmin },
  { path: 'bo-reseller-access', component: LoginReseller },
  {
    path: 'request-access',
    loadComponent: () =>
      import('./pages/request_access/request_access').then(m => m.default)
  },

];