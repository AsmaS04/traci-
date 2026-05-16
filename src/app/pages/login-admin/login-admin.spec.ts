import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { LoginAdmin } from './login-admin';
import { AuthService } from '../../service/Auth.service';
import { TranslationService } from '../../service/translation.service';

describe('LoginAdmin', () => {
  let component: LoginAdmin;
  let fixture: ComponentFixture<LoginAdmin>;

  const mockAuthService = {
    login: jasmine.createSpy('login').and.returnValue(of({})),
    getRole: jasmine.createSpy('getRole').and.returnValue('ROLE_ADMIN'),
    logout: jasmine.createSpy('logout'),
  };
  const mockTranslationService = {
    t: (key: string) => key,
    lang: signal<'en' | 'fr'>('en'),
    loaded: signal(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginAdmin],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default empty credentials', () => {
    expect(component.username).toBe('');
    expect(component.password).toBe('');
    expect(component.error).toBe('');
    expect(component.loading).toBe(false);
  });
});
