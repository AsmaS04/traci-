import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { AdminLayout } from './admin-layout';
import { TranslationService } from '../../../service/translation.service';
import { ThemeService } from '../../../service/theme.service';
import { ClientService } from '../../../service/Client.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceService } from '../../../service/Device.service';
import { NotificationWebsocketService, AppNotification } from '../../../service/notification-websocket.service';

describe('AdminLayout', () => {
  let component: AdminLayout;
  let fixture: ComponentFixture<AdminLayout>;

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
    const mockClientService = jasmine.createSpyObj('ClientService', ['getAll']);
    mockClientService.getAll.and.returnValue(of([]));

    const mockResellerService = jasmine.createSpyObj('ResellerService', ['getAll', 'checkEmail']);
    mockResellerService.getAll.and.returnValue(of([]));
    mockResellerService.checkEmail = jasmine.createSpy('checkEmail').and.returnValue(of({ exists: false }));

    const mockDeviceService = jasmine.createSpyObj('DeviceService', ['getAll']);
    mockDeviceService.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslationService,           useValue: mockTranslationService },
        { provide: ClientService,                useValue: mockClientService      },
        { provide: ResellerService,              useValue: mockResellerService    },
        { provide: DeviceService,                useValue: mockDeviceService      },
        { provide: NotificationWebsocketService, useValue: mockNotifWs           },
        ThemeService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose sidebar user info', () => {
    expect(component.sidebarUser.name).toBe('Admin');
    expect(component.sidebarUser.email).toBe('admin@traci.com');
  });

  it('should expose navbar user info', () => {
    expect(component.navbarUser.name).toBe('Admin');
  });

  it('should clear search results when query is empty', () => {
    component.onSearch('');
    expect(component.searchResults.length).toBe(0);
  });
});
