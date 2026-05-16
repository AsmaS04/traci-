import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, of } from 'rxjs';
import { signal } from '@angular/core';

import { Dashboard } from './dashboard';
import { TranslationService } from '../../../service/translation.service';
import { AdminService } from '../../../service/Admin.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceRequestService } from '../../../service/DeviceRequest.service';
import { NotificationWebsocketService, AppNotification } from '../../../service/notification-websocket.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let adminService: Record<string, jest.Mock>;
  let resellerService: Record<string, jest.Mock>;
  let deviceRequestService: Record<string, jest.Mock>;

  const notifSubject = new Subject<AppNotification>();
  const mockNotifWs = { notification$: notifSubject.asObservable() };
  const mockTranslationService = {
    t: (key: string) => key,
    lang: signal<'en' | 'fr' | 'ar'>('en'),
    loaded: signal(true),
  };

  beforeEach(async () => {
    adminService = {
      getDashboardStats:    jest.fn().mockReturnValue(of({})),
      getDeviceStatus:      jest.fn().mockReturnValue(of({})),
      getGrowthData:        jest.fn().mockReturnValue(of({ labels: [], clients: [], resellers: [] })),
      getEvents:            jest.fn().mockReturnValue(of([])),
      getRevenueStats:      jest.fn().mockReturnValue(of({ currentMonth: 0, previousMonth: 0, allTime: 0 })),
      getRevenueByReseller: jest.fn().mockReturnValue(of([])),
    };

    resellerService = {
      getAll:      jest.fn().mockReturnValue(of([])),
      checkEmail:  jest.fn().mockReturnValue(of({ exists: false })),
    };

    deviceRequestService = {
      getPendingRequests: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslationService,           useValue: mockTranslationService  },
        { provide: AdminService,                 useValue: adminService            },
        { provide: ResellerService,              useValue: resellerService         },
        { provide: DeviceRequestService,         useValue: deviceRequestService    },
        { provide: NotificationWebsocketService, useValue: mockNotifWs            },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set loading to false after dashboard stats load', () => {
    expect(component.loading).toBe(false);
  });

  it('should call all data-loading services on init', () => {
    expect(adminService['getDashboardStats']).toHaveBeenCalled();
    expect(adminService['getRevenueStats']).toHaveBeenCalled();
    expect(resellerService['getAll']).toHaveBeenCalled();
    expect(deviceRequestService['getPendingRequests']).toHaveBeenCalled();
  });

  it('should compute netRevenueMonth as 93% of totalRevenueMonth', () => {
    component.totalRevenueMonth = 1000;
    expect(component.netRevenueMonth).toBe(930);
  });

  it('should compute netRevenueAllTime as 93% of totalRevenueAllTime', () => {
    component.totalRevenueAllTime = 5000;
    expect(component.netRevenueAllTime).toBe(4650);
  });

  it('should validate a correct email', () => {
    expect(component.isValidEmail('admin@traci.com')).toBe(true);
  });

  it('should reject a malformed email', () => {
    expect(component.isValidEmail('not-an-email')).toBe(false);
  });

  it('should validate an 8-digit phone', () => {
    expect(component.isValidPhone('12345678')).toBe(true);
  });

  it('should reject a phone that is not 8 digits', () => {
    expect(component.isValidPhone('1234')).toBe(false);
    expect(component.isValidPhone('123456789')).toBe(false);
  });

  it('should return invalid-email error key for a bad email', () => {
    component.resellerForm = { email: 'bad' };
    expect(component.resellerEmailError).toBe('msg_error_invalid_email');
  });

  it('should return empty string when email field is blank', () => {
    component.resellerForm = { email: '' };
    expect(component.resellerEmailError).toBe('');
  });

  it('should return invalid-phone error key for a bad phone', () => {
    component.resellerForm = { phone: '123' };
    expect(component.resellerPhoneError).toBe('msg_error_invalid_phone');
  });

  it('should return empty string when phone field is blank', () => {
    component.resellerForm = { phone: '' };
    expect(component.resellerPhoneError).toBe('');
  });

  it('should open the add-reseller modal and reset the form', () => {
    component.openAddReseller();
    expect(component.showAddReseller).toBe(true);
    expect(component.resellerForm.username).toBe('');
    expect(component.resellerEmailExists).toBe(false);
  });

  it('should close the add-reseller modal', () => {
    component.showAddReseller = true;
    component.closeAddReseller();
    expect(component.showAddReseller).toBe(false);
  });

  it('should map event types to CSS classes', () => {
    expect(component.evtClass('reseller')).toBe('ev--teal');
    expect(component.evtClass('client')).toBe('ev--blue');
    expect(component.evtClass('device')).toBe('ev--amber');
    expect(component.evtClass('admin')).toBe('ev--purple');
  });

  it('should format a number with Intl.NumberFormat', () => {
    expect(component.fmt(1000)).toBe(new Intl.NumberFormat().format(1000));
  });
});
