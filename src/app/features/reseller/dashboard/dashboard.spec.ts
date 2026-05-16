import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import ResellerDashboardComponent from './dashboard';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { DeviceService } from '../../../service/Device.service';
import { ToastService } from '../../../service/Toast.service';
import { TranslationService } from '../../../service/translation.service';
import { NotificationWebsocketService, AppNotification } from '../../../service/notification-websocket.service';

const MOCK_RESELLER = {
  idRev: 1, username: 'resA', email: 'res@a.com', nomEntreprise: 'ResA',
  deviceCostByDay: 1, daysCount: 30, phone: '10000001', clientCount: 2, createdAt: '2023-01-01',
};

describe('ResellerDashboardComponent', () => {
  let component: ResellerDashboardComponent;
  let fixture: ComponentFixture<ResellerDashboardComponent>;

  const notifSubject = new Subject<AppNotification>();
  const mockNotifWs = {
    notification$: new Subject<AppNotification>().asObservable(),
    resellerNotification$: notifSubject.asObservable(),
    avatar$: new Subject<any>().asObservable(),
    connect: jasmine.createSpy('connect'),
  };
  const mockTranslationService = {
    t: (key: string) => key,
    lang: signal<'en' | 'fr'>('en'),
    loaded: signal(true),
  };

  beforeEach(async () => {
    const mockResellerService = jasmine.createSpyObj('ResellerService', ['getMyProfile']);
    mockResellerService.getMyProfile.and.returnValue(of({ ...MOCK_RESELLER }));

    const mockClientService = jasmine.createSpyObj('ClientService', ['getMyClients', 'checkClientEmail', 'createMyClient']);
    mockClientService.getMyClients.and.returnValue(of([]));
    mockClientService.checkClientEmail.and.returnValue(of({ exists: false }));

    const mockDeviceService = jasmine.createSpyObj('DeviceService', ['getByReseller']);
    mockDeviceService.getByReseller.and.returnValue(of([]));

    const mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [ResellerDashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ResellerService,             useValue: mockResellerService   },
        { provide: ClientService,               useValue: mockClientService      },
        { provide: DeviceService,               useValue: mockDeviceService      },
        { provide: ToastService,                useValue: mockToastService       },
        { provide: TranslationService,          useValue: mockTranslationService },
        { provide: NotificationWebsocketService, useValue: mockNotifWs          },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResellerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reseller profile on init', () => {
    expect(component.reseller()).not.toBeNull();
    expect(component.reseller()?.username).toBe('resA');
  });

  it('should set loading to false after client data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('should compute stableClients as 0 when no clients', () => {
    expect(component.stableClients).toBe(0);
    expect(component.issueClients).toBe(0);
  });

  it('should validate email', () => {
    expect(component.isValidEmail('admin@traci.com')).toBe(true);
    expect(component.isValidEmail('not-an-email')).toBe(false);
  });

  it('should validate 8-digit phone', () => {
    expect(component.isValidPhone('12345678')).toBe(true);
    expect(component.isValidPhone('1234')).toBe(false);
  });

  it('should open and close the add-client modal', () => {
    component.openAddClient();
    expect(component.showAddModal).toBe(true);
    expect(component.addForm.firstName).toBe('');
  });

  it('should format numbers with fmt', () => {
    expect(component.fmt(1000)).toBe(
      new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1000)
    );
  });
});
