import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import ResellerClientsComponent from './client';
import { ClientService } from '../../../service/Client.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceService } from '../../../service/Device.service';
import { AbonnementService } from '../../../service/Abonnement.service';
import { ToastService } from '../../../service/Toast.service';
import { DeviceRequestService } from '../../../service/DeviceRequest.service';
import { TranslationService } from '../../../service/translation.service';
import { Client } from '../../../models/client.model';

const MOCK_CLIENTS: Client[] = [
  {
    idClient: 1, email: 'alice@a.com', login: 'alice', firstName: 'Alice', lastName: 'B',
    phone: '12345678', location: 'Tunis', graceDaysLeft: 5, graceDaysUsed: 0,
    idRev: 1, resellerName: 'ResA', createdAt: '2024-01-01', region: 'Tunis',
  },
  {
    idClient: 2, email: 'bob@b.com', login: 'bob', firstName: 'Bob', lastName: 'C',
    phone: '87654321', location: 'Sfax', graceDaysLeft: 0, graceDaysUsed: 3,
    idRev: 1, resellerName: 'ResA', createdAt: '2024-02-01', region: 'Sfax',
  },
];

const MOCK_RESELLER = {
  idRev: 1, username: 'resA', email: 'res@a.com', nomEntreprise: 'ResA',
  deviceCostByDay: 1, daysCount: 30, phone: '10000001', clientCount: 2, createdAt: '2023-01-01',
};

describe('ResellerClientsComponent', () => {
  let component: ResellerClientsComponent;
  let fixture: ComponentFixture<ResellerClientsComponent>;

  const mockTranslationService = {
    t: (key: string) => key,
    lang: signal<'en' | 'fr'>('en'),
    loaded: signal(true),
  };

  beforeEach(async () => {
    const mockClientService = jasmine.createSpyObj('ClientService', [
      'getMyClients', 'suspendMyClient', 'reactivateMyClient',
      'updateMyClient', 'createMyClient', 'checkClientEmail',
    ]);
    mockClientService.getMyClients.and.returnValue(of([...MOCK_CLIENTS]));
    mockClientService.checkClientEmail.and.returnValue(of({ exists: false }));

    const mockResellerService = jasmine.createSpyObj('ResellerService', ['getMyProfile']);
    mockResellerService.getMyProfile.and.returnValue(of({ ...MOCK_RESELLER }));

    const mockDeviceService = jasmine.createSpyObj('DeviceService', [
      'getByClient', 'getLibreByReseller',
    ]);
    mockDeviceService.getByClient.and.returnValue(of([]));
    mockDeviceService.getLibreByReseller.and.returnValue(of([]));

    const mockAboService = jasmine.createSpyObj('AbonnementService', ['getByClient', 'assignDevice']);
    mockAboService.getByClient.and.returnValue(of([]));
    mockAboService.assignDevice.and.returnValue(of({}));

    const mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    const mockDeviceRequestService = jasmine.createSpyObj('DeviceRequestService', ['createRequest']);
    mockDeviceRequestService.createRequest.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ResellerClientsComponent],
      providers: [
        { provide: ClientService,        useValue: mockClientService        },
        { provide: ResellerService,      useValue: mockResellerService      },
        { provide: DeviceService,        useValue: mockDeviceService        },
        { provide: AbonnementService,    useValue: mockAboService           },
        { provide: ToastService,         useValue: mockToastService         },
        { provide: DeviceRequestService, useValue: mockDeviceRequestService },
        { provide: TranslationService,   useValue: mockTranslationService   },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResellerClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load clients on init', () => {
    expect(component.clients.length).toBe(2);
    expect(component.clients[0].firstName).toBe('Alice');
  });
  
  it('should filter by search term', () => {
    component.search = 'alice';
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].firstName).toBe('Alice');

    component.search = 'xyz';
    expect(component.filtered.length).toBe(0);
  });

  it('should filter by active status', () => {
    component.filterStatus = 'active';
    expect(component.filtered.every(c => component.isActive(c))).toBe(true);
  });

  it('should filter by inactive status', () => {
    component.filterStatus = 'inactive';
    expect(component.filtered.every(c => !component.isActive(c))).toBe(true);
  });

  it('should open and close the add modal', () => {
    component.openAdd();
    expect(component.showModal).toBe(true);
    expect(component.isEdit).toBe(false);
    component.closeModal();
    expect(component.showModal).toBe(false);
  });

  it('should open the edit modal with client data', () => {
    component.openEdit(MOCK_CLIENTS[0]);
    expect(component.showModal).toBe(true);
    expect(component.isEdit).toBe(true);
    expect(component.form.email).toBe('alice@a.com');
  });

  it('should open and close the slide panel', () => {
    component.openPanel(MOCK_CLIENTS[0]);
    expect(component.panelOpen).toBe(true);
    expect(component.panelClient).toBe(MOCK_CLIENTS[0]);
    component.closePanel();
    expect(component.panelOpen).toBe(false);
  });

  it('should validate email', () => {
    expect(component.isValidEmail('a@b.com')).toBe(true);
    expect(component.isValidEmail('bad-email')).toBe(false);
  });

  it('should validate phone', () => {
    expect(component.isValidPhone('12345678')).toBe(true);
    expect(component.isValidPhone('1234')).toBe(false);
  });

  it('should format date as em-dash for null', () => {
    expect(component.formatDate(null)).toBe('—');
    expect(component.formatDate(undefined)).toBe('—');
  });
});
