import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import ResellerLayout from './reseller-layout';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { DeviceService } from '../../../service/Device.service';
import { TranslationService } from '../../../service/translation.service';
import { ThemeService } from '../../../service/theme.service';
import { NotificationWebsocketService, AppNotification } from '../../../service/notification-websocket.service';

const MOCK_RESELLER = {
  idRev: 1, username: 'resA', email: 'res@a.com', nomEntreprise: 'ResA',
  deviceCostByDay: 1, daysCount: 30, phone: '10000001', clientCount: 2, createdAt: '2023-01-01',
};

describe('ResellerLayout', () => {
  let component: ResellerLayout;
  let fixture: ComponentFixture<ResellerLayout>;

  const mockTranslationService = {
    t: (key: string) => key,
    lang: signal<'en' | 'fr'>('en'),
    loaded: signal(true),
  };
  const mockNotifWs = {
    notification$: new Subject<AppNotification>().asObservable(),
    resellerNotification$: new Subject<AppNotification>().asObservable(),
    avatar$: new Subject<any>().asObservable(),
    connect: jasmine.createSpy('connect'),
    disconnect: jasmine.createSpy('disconnect'),
  };

  beforeEach(async () => {
    const mockResellerService = jasmine.createSpyObj('ResellerService', ['getMyProfile', 'getAll']);
    mockResellerService.getMyProfile.and.returnValue(of({ ...MOCK_RESELLER }));
    mockResellerService.getAll.and.returnValue(of([]));

    const mockClientService = jasmine.createSpyObj('ClientService', ['getMyClients', 'getAll']);
    mockClientService.getMyClients.and.returnValue(of([]));
    mockClientService.getAll.and.returnValue(of([]));

    const mockDeviceService = jasmine.createSpyObj('DeviceService', ['getByReseller', 'getAll']);
    mockDeviceService.getByReseller.and.returnValue(of([]));
    mockDeviceService.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ResellerLayout],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ResellerService,              useValue: mockResellerService   },
        { provide: ClientService,                useValue: mockClientService      },
        { provide: DeviceService,                useValue: mockDeviceService      },
        { provide: TranslationService,           useValue: mockTranslationService },
        { provide: NotificationWebsocketService, useValue: mockNotifWs           },
        ThemeService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResellerLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reseller profile on init', () => {
    expect(component.reseller.username).toBe('resA');
    expect(component.reseller.email).toBe('res@a.com');
  });

  it('should connect to WebSocket on init', () => {
    expect(mockNotifWs.connect).toHaveBeenCalled();
  });
});
