import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './Auth.guard';

const emptyRoute = {} as ActivatedRouteSnapshot;
const emptyState = {} as RouterStateSnapshot;

describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should deny access and redirect to /client when no token is stored', () => {
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const result = TestBed.runInInjectionContext(
      () => authGuard(['ROLE_ADMIN'])(emptyRoute, emptyState)
    );
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/client']);
  });

  it('should deny access and redirect when token exists but role is missing', () => {
    localStorage.setItem('token', 'tok');
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const result = TestBed.runInInjectionContext(
      () => authGuard(['ROLE_ADMIN'])(emptyRoute, emptyState)
    );
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/client']);
  });

  it('should deny access when role is not in the allowed list', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('role',  'ROLE_CLIENT');
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const result = TestBed.runInInjectionContext(
      () => authGuard(['ROLE_ADMIN'])(emptyRoute, emptyState)
    );
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/client']);
  });

  it('should allow access when role matches the single allowed role', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('role',  'ROLE_ADMIN');
    const result = TestBed.runInInjectionContext(
      () => authGuard(['ROLE_ADMIN'])(emptyRoute, emptyState)
    );
    expect(result).toBe(true);
  });

  it('should allow access when role is one of multiple allowed roles', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('role',  'ROLE_RESELLER');
    const result = TestBed.runInInjectionContext(
      () => authGuard(['ROLE_ADMIN', 'ROLE_RESELLER'])(emptyRoute, emptyState)
    );
    expect(result).toBe(true);
  });

  it('should allow ROLE_CLIENT when it is explicitly listed', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('role',  'ROLE_CLIENT');
    const result = TestBed.runInInjectionContext(
      () => authGuard(['ROLE_CLIENT'])(emptyRoute, emptyState)
    );
    expect(result).toBe(true);
  });

  it('should not redirect when access is granted', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('role',  'ROLE_ADMIN');
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    TestBed.runInInjectionContext(
      () => authGuard(['ROLE_ADMIN'])(emptyRoute, emptyState)
    );
    expect(spy).not.toHaveBeenCalled();
  });
});
