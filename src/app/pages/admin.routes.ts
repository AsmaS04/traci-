import { Routes } from '@angular/router';
import { LoginAdmin } from '../pages/login-admin/login-admin';
import { LoginClient } from '../pages/login-client/login-client';
import { LoginReseller } from '../pages/login-reseller/login-reseller';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'client',
    pathMatch: 'full'
  },

  {
    path: 'client',
    component: LoginClient
  },

  {
    path: 'bo-admin-access',
    component: LoginAdmin
  },

  {
    path: 'bo-reseller-access',
    component: LoginReseller
  },

  {
    path: 'admin',
    loadChildren: () =>
      import('../pages/admin.routes')
        .then(m => m.routes)
  }

];