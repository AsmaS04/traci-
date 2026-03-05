// src/app/pages/reseller.routes.ts

import { Routes } from '@angular/router';

export const resellerRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reseller/reseller-layout/reseller-layout').then(m => m.default),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/reseller/dashboard/dashboard').then(m => m.default),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('../features/reseller/client/client').then(m => m.default),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];