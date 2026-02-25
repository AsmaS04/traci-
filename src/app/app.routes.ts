import { Routes } from '@angular/router';
import { LoginAdmin }    from './pages/login-admin/login-admin';
import { LoginClient }   from './pages/login-client/login-client';
import { LoginReseller } from './pages/login-reseller/login-reseller';
import { AdminLayout } from './pages/admin/admin-layout/admin-layout';
export const routes: Routes = [

  // DEFAULT → dashboard
  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },

  // ADMIN SHELL (sidebar + router-outlet)
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

  // LOGIN PAGES (public, no sidebar)
  { path: 'client',           component: LoginClient },
  { path: 'bo-admin-access',  component: LoginAdmin },
  { path: 'bo-reseller-access', component: LoginReseller },
];