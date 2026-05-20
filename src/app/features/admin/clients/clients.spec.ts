import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Clients } from './clients';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceService } from '../../../service/Device.service';
import { AbonnementService } from '../../../service/Abonnement.service';
import { Client } from '../../../models/client.model';
import { Reseller } from '../../../models/reseller.model';

const MOCK_CLIENTS: Client[] = [
  { idClient: 1, email: 'ahmed@a.com', login: 'ahmed', firstName: 'Ahmed', lastName: 'Ben Ali', phone: '12345678', location: 'Tunis', graceDaysLeft: 5,  graceDaysUsed: 0, idRev: 1, resellerName: 'ResellerX', createdAt: '2024-01-01', region: 'Tunis', subscriptionStatus: 'active'   },
  { idClient: 2, email: 'sara@b.com',  login: 'sara',  firstName: 'Sara',  lastName: 'Triki',   phone: '87654321', location: 'Sfax',  graceDaysLeft: 0,  graceDaysUsed: 3, idRev: 2, resellerName: 'ResellerY', createdAt: '2024-02-01', region: 'Sfax',  subscriptionStatus: 'expired'  },
];

const MOCK_RESELLERS: Reseller[] = [
  { idRev: 1, username: 'resA', email: 'resA@x.com', nomEntreprise: 'ResellerX', deviceCostByDay: 1, daysCount: 30, phone: '10000001', clientCount: 5, createdAt: '2023-01-01' },
  { idRev: 2, username: 'resB', email: 'resB@x.com', nomEntreprise: 'ResellerY', deviceCostByDay: 2, daysCount: 30, phone: '10000002', clientCount: 3, createdAt: '2023-01-01' },
];

describe('Clients', () => {
  let component: Clients;
  let fixture: ComponentFixture<Clients>;
  let mockClientService: jest.Mocked<Pick<ClientService, 'getAll' | 'update' | 'suspend' | 'reactivate'>>;
  let mockResellerService: jest.Mocked<Pick<ResellerService, 'getAll'>>;
  let mockDeviceService: jest.Mocked<Pick<DeviceService, 'getByClient'>>;

  const mockTranslationService = {
    t: (key: string) => key,
    lang: signal<'en' | 'fr'>('en'),
    loaded: signal(true),
  };

  beforeEach(async () => {
    mockClientService = {
      getAll:      jest.fn().mockReturnValue(of([...MOCK_CLIENTS])),
      update:      jest.fn(),
      suspend:     jest.fn(),
      reactivate:  jest.fn(),
    } as any;

    mockResellerService = {
      getAll: jest.fn().mockReturnValue(of([...MOCK_RESELLERS])),
    } as any;

    mockDeviceService = {
      getByClient: jest.fn().mockReturnValue(of([])),
    } as any;

    const mockAboService = {
      getByClient: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [Clients, FormsModule],
      providers: [
        { provide: ClientService,      useValue: mockClientService      },
        { provide: ResellerService,    useValue: mockResellerService    },
        { provide: DeviceService,      useValue: mockDeviceService      },
        { provide: AbonnementService,  useValue: mockAboService         },
        { provide: TranslationService, useValue: mockTranslationService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Clients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.view).toBe('table');
    expect(component.selected).toBeNull();
    expect(component.showModal).toBe(false);
    expect(component.modalMode).toBe('edit');
    expect(component.formData).toEqual({});
    expect(component.searchQuery).toBe('');
    expect(component.filterActive).toBe('all');
    expect(component.sortField).toBe('idClient');
    expect(component.sortAsc).toBe(true);
  });

  it('should load clients on init', () => {
    expect(component.clients.length).toBe(2);
    expect(component.clients[0].firstName).toBe('Ahmed');
  });

  it('should load resellers on init', () => {
    expect(component.resellers.length).toBe(2);
    expect(component.resellers[0].username).toBe('resA');
  });

  it('should have 24 predefined regions starting with Tunis', () => {
    expect(component.regions.length).toBe(24);
    expect(component.regions[0]).toBe('Tunis');
  });

  describe('isActive', () => {
    it('should return true when subscriptionStatus is active', () => {
      expect(component.isActive(MOCK_CLIENTS[0])).toBe(true);
    });

    it('should return false when subscriptionStatus is not active', () => {
      expect(component.isActive(MOCK_CLIENTS[1])).toBe(false);
    });
  });

  describe('fullName', () => {
    it('should combine firstName and lastName', () => {
      expect(component.fullName(MOCK_CLIENTS[0])).toBe('Ahmed Ben Ali');
    });
  });

  describe('filtered getter', () => {
    it('should return all clients when no filters applied', () => {
      expect(component.filtered.length).toBe(2);
    });

    it('should filter by search query on first name', () => {
      component.searchQuery = 'Ahmed';
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].firstName).toBe('Ahmed');
    });

    it('should filter active clients only', () => {
      component.filterActive = 'active';
      expect(component.filtered.every(c => component.isActive(c))).toBe(true);
    });

    it('should filter inactive clients only', () => {
      component.filterActive = 'inactive';
      expect(component.filtered.every(c => !component.isActive(c))).toBe(true);
    });

    it('should sort ascending by firstName', () => {
      component.sortField = 'firstName';
      component.sortAsc = true;
      const result = component.filtered;
      expect(result[0].firstName.localeCompare(result[1].firstName)).toBeLessThanOrEqual(0);
    });

    it('should sort descending by firstName', () => {
      component.sortField = 'firstName';
      component.sortAsc = false;
      const result = component.filtered;
      expect(result[0].firstName.localeCompare(result[1].firstName)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sortBy', () => {
    it('should toggle sort direction when same field clicked', () => {
      component.sortField = 'firstName';
      component.sortAsc = true;
      component.sortBy('firstName');
      expect(component.sortAsc).toBe(false);
    });

    it('should set new field and reset to ascending for a different field', () => {
      component.sortField = 'idClient';
      component.sortBy('firstName');
      expect(component.sortField).toBe('firstName');
      expect(component.sortAsc).toBe(true);
    });
  });

  describe('sortIcon', () => {
    it('should return ↕ for a non-active sort field', () => {
      expect(component.sortIcon('firstName')).toBe('↕');
    });

    it('should return ↑ for active ascending field', () => {
      component.sortField = 'firstName';
      component.sortAsc = true;
      expect(component.sortIcon('firstName')).toBe('↑');
    });

    it('should return ↓ for active descending field', () => {
      component.sortField = 'firstName';
      component.sortAsc = false;
      expect(component.sortIcon('firstName')).toBe('↓');
    });
  });

  describe('openDetail and backToTable', () => {
    it('should switch to detail view with the selected client', () => {
      component.openDetail(MOCK_CLIENTS[0]);
      expect(component.view).toBe('detail');
      expect(component.selected).toBe(MOCK_CLIENTS[0]);
    });

    it('should return to table view and clear selection', () => {
      component.view = 'detail';
      component.selected = MOCK_CLIENTS[0];
      component.backToTable();
      expect(component.view).toBe('table');
      expect(component.selected).toBeNull();
    });
  });

  describe('openEdit', () => {
    it('should open edit modal with a copy of the client data', () => {
      const event = new Event('click');
      const stopSpy = jest.spyOn(event, 'stopPropagation');
      component.openEdit(MOCK_CLIENTS[0], event);
      expect(component.showModal).toBe(true);
      expect(component.modalMode).toBe('edit');
      expect(component.formData).toEqual(MOCK_CLIENTS[0]);
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('onResellerChange', () => {
    it('should update resellerName when idRev changes', () => {
      component.formData.idRev = 2;
      component.onResellerChange();
      expect(component.formData.resellerName).toBe('ResellerY');
    });
  });

  describe('closeModal', () => {
    it('should hide modal and reset formData', () => {
      component.showModal = true;
      component.formData = { firstName: 'Test' };
      component.closeModal();
      expect(component.showModal).toBe(false);
      expect(component.formData).toEqual({});
    });
  });

  describe('formatDate', () => {
    it('should return — for null', () => {
      expect(component.formatDate(null)).toBe('—');
    });

    it('should return — for undefined', () => {
      expect(component.formatDate(undefined)).toBe('—');
    });

    it('should return a formatted string for a valid date', () => {
      const result = component.formatDate('2023-03-10');
      expect(result).toContain('2023');
    });
  });

  describe('pagination', () => {
    it('should initialize with page 1 and page size 10', () => {
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
    });

    it('paginated should return a slice of filtered', () => {
      component.pageSize = 1;
      component.currentPage = 1;
      expect(component.paginated.length).toBe(1);
    });

    it('prevPage should not go below page 1', () => {
      component.currentPage = 1;
      component.prevPage();
      expect(component.currentPage).toBe(1);
    });

    it('nextPage should advance when not on last page', () => {
      component.pageSize = 1;
      component.currentPage = 1;
      component.nextPage();
      expect(component.currentPage).toBe(2);
    });

    it('onPageSizeChange should reset to page 1', () => {
      component.currentPage = 3;
      component.onPageSizeChange();
      expect(component.currentPage).toBe(1);
    });

    it('goToPage should update currentPage for a number', () => {
      component.pageSize = 1;
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
    });

    it('goToPage should ignore ellipsis', () => {
      component.currentPage = 1;
      component.goToPage('...');
      expect(component.currentPage).toBe(1);
    });
  });
});
