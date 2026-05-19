import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import ResellerDevicesComponent from './devices';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { DeviceService } from '../../../service/Device.service';
import { AbonnementService } from '../../../service/Abonnement.service';
import { ToastService } from '../../../service/Toast.service';
import { DeviceRequestService } from '../../../service/DeviceRequest.service';
import { TranslationService } from '../../../service/translation.service';
import { Device } from '../../../models/device.model';

const MOCK_RESELLER = {
  idRev: 1, username: 'resA', email: 'res@a.com', nomEntreprise: 'ResA',
  deviceCostByDay: 1, daysCount: 30, phone: '10000001', clientCount: 2, createdAt: '2023-01-01',
};

const MOCK_DEVICES: Device[] = [
  { idDevice: 1, numDevice: 'D001', imei: '111111111111111', model: 'ModelX', status: 'actif',  clientId: 1,   clientName: 'Alice', dateActivation: '2024-01-01', createdAt: '2024-01-01' },
  { idDevice: 2, numDevice: 'D002', imei: '222222222222222', model: 'ModelY', status: 'expiré', clientId: 2,   clientName: 'Bob',   dateActivation: '2024-01-01', createdAt: '2024-01-01' },
  { idDevice: 3, numDevice: 'D003', imei: '333333333333333', model: 'ModelX', status: 'libre',  clientId: null, clientName: null,   dateActivation: null,        createdAt: '2024-01-01' },
];

describe('ResellerDevicesComponent', () => {
  let component: ResellerDevicesComponent;
  let fixture: ComponentFixture<ResellerDevicesComponent>;

  const mockTranslationService = {
    t: (key: string) => key,
    lang: signal<'en' | 'fr'>('en'),
    loaded: signal(true),
  };

  beforeEach(async () => {
    const mockResellerService = jasmine.createSpyObj('ResellerService', ['getMyProfile']);
    mockResellerService.getMyProfile.and.returnValue(of({ ...MOCK_RESELLER }));

    const mockClientService = jasmine.createSpyObj('ClientService', ['getMyClients']);
    mockClientService.getMyClients.and.returnValue(of([]));

    const mockDeviceService = jasmine.createSpyObj('DeviceService', [
      'getByReseller', 'getLibreByReseller',
    ]);
    mockDeviceService.getByReseller.and.returnValue(of([...MOCK_DEVICES]));
    mockDeviceService.getLibreByReseller.and.returnValue(of([MOCK_DEVICES[2]]));

    const mockAboService = jasmine.createSpyObj('AbonnementService', ['assignDevice', 'getByClient']);
    mockAboService.assignDevice.and.returnValue(of({}));
    mockAboService.getByClient.and.returnValue(of([]));

    const mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    const mockDeviceRequestService = jasmine.createSpyObj('DeviceRequestService', ['createRequest']);
    mockDeviceRequestService.createRequest.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ResellerDevicesComponent],
      providers: [
        { provide: ResellerService,      useValue: mockResellerService      },
        { provide: ClientService,        useValue: mockClientService        },
        { provide: DeviceService,        useValue: mockDeviceService        },
        { provide: AbonnementService,    useValue: mockAboService           },
        { provide: ToastService,         useValue: mockToastService         },
        { provide: DeviceRequestService, useValue: mockDeviceRequestService },
        { provide: TranslationService,   useValue: mockTranslationService   },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResellerDevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load devices on init', () => {
    expect(component.devices.length).toBe(3);
  });

  it('should compute totalCount, activeCount, expiredCount', () => {
    expect(component.totalCount).toBe(3);
    expect(component.activeCount).toBe(1);
  });

  it('should return all devices when no filter applied', () => {
    expect(component.filtered.length).toBe(3);
  });

  it('should filter by search term', () => {
    component.search = 'D001';
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].numDevice).toBe('D001');
  });

  it('should filter by status', () => {
    component.filterStatus = 'actif';
    expect(component.filtered.length).toBe(1);
  });
});
