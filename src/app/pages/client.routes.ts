// src/app/pages/client.routes.ts

import { Routes } from '@angular/router';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./client/client-layout/client-layout'),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../features/client/dashboard/dashboard')
      },
      {
        path: 'abonnements',
        loadComponent: () => import('../features/client/abonnements/abonnements')
      },
      {
        path: 'factures',
        loadComponent: () => import('../features/client/factures/factures')
      },
      {
        path: 'profil',
        loadComponent: () => import('../features/client/profil/profil')
      }
    ]
  }
];
