import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './Auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });
    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router   = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── login() ───────────────────────────────────────────────
  describe('login()', () => {
    it('should POST to /api/auth/login with credentials', () => {
      service.login('admin', 'pass').subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'pass' });
      req.flush({ token: 't', username: 'admin', role: 'ROLE_ADMIN', email: 'a@a.com' });
    });

    it('should store token, username, role and email in localStorage', () => {
      service.login('admin', 'pass').subscribe(() => {
        expect(localStorage.getItem('token')).toBe('tok123');
        expect(localStorage.getItem('username')).toBe('adminUser');
        expect(localStorage.getItem('role')).toBe('ROLE_ADMIN');
        expect(localStorage.getItem('email')).toBe('admin@traci.com');
      });
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
        token: 'tok123', username: 'adminUser', role: 'ROLE_ADMIN', email: 'admin@traci.com',
      });
    });

    it('should store idRev when present in the response', () => {
      service.login('res', 'pass').subscribe(() => {
        expect(localStorage.getItem('idRev')).toBe('42');
      });
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
        token: 't', username: 'res', role: 'ROLE_RESELLER', email: 'r@r.com', idRev: 42,
      });
    });

    it('should remove idRev when not present in the response', () => {
      localStorage.setItem('idRev', '99');
      service.login('admin', 'pass').subscribe(() => {
        expect(localStorage.getItem('idRev')).toBeNull();
      });
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
        token: 't', username: 'admin', role: 'ROLE_ADMIN', email: 'a@a.com',
      });
    });

    it('should store idClient when present in the response', () => {
      service.login('cli', 'pass').subscribe(() => {
        expect(localStorage.getItem('idClient')).toBe('7');
      });
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
        token: 't', username: 'cli', role: 'ROLE_CLIENT', email: 'c@c.com', idClient: 7,
      });
    });

    it('should remove idClient when not present in the response', () => {
      localStorage.setItem('idClient', '5');
      service.login('admin', 'pass').subscribe(() => {
        expect(localStorage.getItem('idClient')).toBeNull();
      });
      httpMock.expectOne('http://localhost:8080/api/auth/login').flush({
        token: 't', username: 'admin', role: 'ROLE_ADMIN', email: 'a@a.com',
      });
    });
  });

  // ── logout() ──────────────────────────────────────────────
  describe('logout()', () => {
    it('should clear all auth keys from localStorage', () => {
      localStorage.setItem('token',    'tok');
      localStorage.setItem('username', 'user');
      localStorage.setItem('role',     'ROLE_ADMIN');
      localStorage.setItem('email',    'a@a.com');
      localStorage.setItem('idRev',    '1');
      localStorage.setItem('idClient', '2');

      jest.spyOn(router, 'navigate').mockResolvedValue(true);
      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
      expect(localStorage.getItem('idRev')).toBeNull();
      expect(localStorage.getItem('idClient')).toBeNull();
    });

    it('should navigate to /client after logout', () => {
      const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      service.logout();
      expect(spy).toHaveBeenCalledWith(['/client']);
    });
  });

  // ── getters ───────────────────────────────────────────────
  describe('getters', () => {
    beforeEach(() => {
      localStorage.setItem('token',    'mytoken');
      localStorage.setItem('role',     'ROLE_ADMIN');
      localStorage.setItem('username', 'admin');
      localStorage.setItem('email',    'admin@traci.com');
      localStorage.setItem('idRev',    '5');
    });

    it('getToken() should return the stored token', () => {
      expect(service.getToken()).toBe('mytoken');
    });

    it('getToken() should return null when absent', () => {
      localStorage.removeItem('token');
      expect(service.getToken()).toBeNull();
    });

    it('getRole() should return the stored role', () => {
      expect(service.getRole()).toBe('ROLE_ADMIN');
    });

    it('getUsername() should return the stored username', () => {
      expect(service.getUsername()).toBe('admin');
    });

    it('getEmail() should return the stored email', () => {
      expect(service.getEmail()).toBe('admin@traci.com');
    });

    it('getIdRev() should return idRev as a number', () => {
      expect(service.getIdRev()).toBe(5);
    });

    it('getIdRev() should return null when not set', () => {
      localStorage.removeItem('idRev');
      expect(service.getIdRev()).toBeNull();
    });

    it('isLoggedIn() should return true when a token exists', () => {
      expect(service.isLoggedIn()).toBe(true);
    });

    it('isLoggedIn() should return false when no token', () => {
      localStorage.removeItem('token');
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ── redirectByRole() ──────────────────────────────────────
  describe('redirectByRole()', () => {
    let navigateSpy: jest.SpyInstance;

    beforeEach(() => {
      navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    });

    it('should navigate to /admin/dashboard for ROLE_ADMIN', () => {
      localStorage.setItem('role', 'ROLE_ADMIN');
      service.redirectByRole();
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should navigate to /reseller-dashboard/dashboard for ROLE_RESELLER', () => {
      localStorage.setItem('role', 'ROLE_RESELLER');
      service.redirectByRole();
      expect(navigateSpy).toHaveBeenCalledWith(['/reseller-dashboard/dashboard']);
    });

    it('should navigate to /client-dashboard/dashboard for ROLE_CLIENT', () => {
      localStorage.setItem('role', 'ROLE_CLIENT');
      service.redirectByRole();
      expect(navigateSpy).toHaveBeenCalledWith(['/client-dashboard/dashboard']);
    });

    it('should navigate to /client for an unrecognised role', () => {
      localStorage.setItem('role', 'ROLE_UNKNOWN');
      service.redirectByRole();
      expect(navigateSpy).toHaveBeenCalledWith(['/client']);
    });

    it('should navigate to /client when no role is stored', () => {
      service.redirectByRole();
      expect(navigateSpy).toHaveBeenCalledWith(['/client']);
    });
  });
});
