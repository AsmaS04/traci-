import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || !role) {
      router.navigate(['/client']);
      return false;
    }

    if (allowedRoles.includes(role)) {
      return true;
    }

    router.navigate(['/client']);
    return false;
  };
};