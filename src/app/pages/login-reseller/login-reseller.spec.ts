import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { LoginReseller } from './login-reseller';
import { AuthService } from '../../service/Auth.service';
import { TranslationService } from '../../service/translation.service';

describe('LoginReseller', () => {
  let component: LoginReseller;
  let fixture: ComponentFixture<LoginReseller>;

  const mockAuthService = {
    login: jasmine.createSpy('login').and.returnValue(of({})),
    getRole: jasmine.createSpy('getRole').and.returnValue('ROLE_RESELLER'),
    logout: jasmine.createSpy('logout'),
  };
  const mockTranslationService = {
    t: (key: string) => key,
    lang: signal<'en' | 'fr'>('en'),
    loaded: signal(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginReseller],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginReseller);
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
