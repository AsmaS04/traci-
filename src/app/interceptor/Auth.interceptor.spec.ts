import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './Auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should not attach an Authorization header when no token is stored', () => {
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should attach a Bearer Authorization header when a token is stored', () => {
    localStorage.setItem('token', 'my-jwt-token');
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('should forward the request method unchanged', () => {
    localStorage.setItem('token', 'tok');
    http.post('/api/data', { x: 1 }).subscribe();
    const req = httpMock.expectOne('/api/data');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should forward the request body unchanged', () => {
    localStorage.setItem('token', 'tok');
    const body = { name: 'Alice', role: 'admin' };
    http.post('/api/users', body).subscribe();
    const req = httpMock.expectOne('/api/users');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('should not modify existing headers beyond adding Authorization', () => {
    localStorage.setItem('token', 'tok');
    http.get('/api/test', { headers: { 'X-Custom': 'value' } }).subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('X-Custom')).toBe('value');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({});
  });

  it('should pass through a successful response without modification', () => {
    localStorage.setItem('token', 'tok');
    let responseBody: any;
    http.get('/api/me').subscribe(res => (responseBody = res));
    httpMock.expectOne('/api/me').flush({ id: 1, name: 'Admin' });
    expect(responseBody).toEqual({ id: 1, name: 'Admin' });
  });
});
