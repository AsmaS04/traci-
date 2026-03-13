import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Clients } from './clients';
import { TranslationService } from '../../../service/translation.service';
import { Client } from '../../../models/client.model';

describe('Clients', () => {
  let component: Clients;
  let fixture: ComponentFixture<Clients>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj('TranslationService', [], {
      // Add any properties if needed
    });

    await TestBed.configureTestingModule({
      imports: [Clients, FormsModule],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService }
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
    expect(component.showModal).toBeFalse();
    expect(component.showDeleteModal).toBeFalse();
    expect(component.modalMode).toBe('add');
    expect(component.toDelete).toBeNull();
    expect(component.formData).toEqual({});
    expect(component.searchQuery).toBe('');
    expect(component.filterActive).toBe('all');
    expect(component.sortField).toBe('id');
    expect(component.sortAsc).toBeTrue();
  });

  it('should have predefined regions', () => {
    expect(component.regions).toBeDefined();
    expect(component.regions.length).toBe(24);
    expect(component.regions[0]).toBe('Tunis');
  });

  it('should have predefined resellers', () => {
    expect(component.resellers).toBeDefined();
    expect(component.resellers.length).toBe(8);
    expect(component.resellers[0].name).toBe('Khalil Mansour');
  });

  it('should have initial clients data', () => {
    expect(component.clients).toBeDefined();
    expect(component.clients.length).toBe(12);
    expect(component.clients[0].name).toBe('Société Elyes');
  });

  describe('filtered getter', () => {
    it('should return all clients when no filters', () => {
      expect(component.filtered.length).toBe(12);
    });

    it('should filter by search query', () => {
      component.searchQuery = 'Elyes';
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].name).toBe('Société Elyes');
    });

    it('should filter by active status', () => {
      component.filterActive = 'active';
      const activeCount = component.clients.filter(c => c.isActive).length;
      expect(component.filtered.length).toBe(activeCount);
    });

    it('should filter by inactive status', () => {
      component.filterActive = 'inactive';
      const inactiveCount = component.clients.filter(c => !c.isActive).length;
      expect(component.filtered.length).toBe(inactiveCount);
    });

    it('should sort by field ascending', () => {
      component.sortField = 'name';
      component.sortAsc = true;
      const filtered = component.filtered;
      expect(filtered[0].name.localeCompare(filtered[1].name)).toBeLessThanOrEqual(0);
    });

    it('should sort by field descending', () => {
      component.sortField = 'name';
      component.sortAsc = false;
      const filtered = component.filtered;
      expect(filtered[0].name.localeCompare(filtered[1].name)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sortBy', () => {
    it('should toggle sort direction if same field', () => {
      component.sortField = 'name';
      component.sortAsc = true;
      component.sortBy('name');
      expect(component.sortAsc).toBeFalse();
    });

    it('should set new field and ascending if different field', () => {
      component.sortField = 'id';
      component.sortBy('name');
      expect(component.sortField).toBe('name');
      expect(component.sortAsc).toBeTrue();
    });
  });

  describe('sortIcon', () => {
    it('should return ↕ for unsorted field', () => {
      expect(component.sortIcon('name')).toBe('↕');
    });

    it('should return ↑ for ascending sort', () => {
      component.sortField = 'name';
      component.sortAsc = true;
      expect(component.sortIcon('name')).toBe('↑');
    });

    it('should return ↓ for descending sort', () => {
      component.sortField = 'name';
      component.sortAsc = false;
      expect(component.sortIcon('name')).toBe('↓');
    });
  });

  describe('openDetail and backToTable', () => {
    it('should open detail view', () => {
      const client = component.clients[0];
      component.openDetail(client);
      expect(component.view).toBe('detail');
      expect(component.selected).toBe(client);
    });

    it('should go back to table view', () => {
      component.view = 'detail';
      component.selected = component.clients[0];
      component.backToTable();
      expect(component.view).toBe('table');
      expect(component.selected).toBeNull();
    });
  });

  describe('openAdd', () => {
    it('should open add modal with default form data', () => {
      component.openAdd();
      expect(component.showModal).toBeTrue();
      expect(component.modalMode).toBe('add');
      expect(component.formData.region).toBe('Tunis');
      expect(component.formData.isActive).toBeTrue();
      expect(component.formData.resellerId).toBe(component.resellers[0].id);
      expect(component.formData.resellerName).toBe(component.resellers[0].companyName);
    });
  });

  describe('openEdit', () => {
    it('should open edit modal with client data', () => {
      const client = component.clients[0];
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      component.openEdit(client, event);
      expect(component.showModal).toBeTrue();
      expect(component.modalMode).toBe('edit');
      expect(component.formData).toEqual(client);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('onResellerChange', () => {
    it('should update resellerName when resellerId changes', () => {
      component.formData.resellerId = 2;
      component.onResellerChange();
      expect(component.formData.resellerName).toBe('NetPlus Solutions');
    });
  });

  describe('saveForm', () => {
    it('should add new client in add mode', () => {
      const initialLength = component.clients.length;
      component.modalMode = 'add';
      component.formData = {
        name: 'New Client',
        email: 'new@client.com',
        phone: '+216 70 123 456',
        region: 'Sousse',
        resellerId: 3,
        resellerName: 'ConnectPro Tunis',
        isActive: true
      };
      component.saveForm();
      expect(component.clients.length).toBe(initialLength + 1);
      const newClient = component.clients[component.clients.length - 1];
      expect(newClient.name).toBe('New Client');
      expect(newClient.id).toBeGreaterThan(0);
      expect(component.showModal).toBeFalse();
    });

    it('should update existing client in edit mode', () => {
      const client = component.clients[0];
      component.modalMode = 'edit';
      component.formData = { ...client, name: 'Updated Name' };
      component.saveForm();
      const updatedClient = component.clients.find(c => c.id === client.id);
      expect(updatedClient?.name).toBe('Updated Name');
      expect(component.showModal).toBeFalse();
    });

    it('should update selected client if editing selected', () => {
      const client = component.clients[0];
      component.selected = client;
      component.modalMode = 'edit';
      component.formData = { ...client, name: 'Updated Selected' };
      component.saveForm();
      expect(component.selected?.name).toBe('Updated Selected');
    });
  });

  describe('closeModal', () => {
    it('should close modal and reset form data', () => {
      component.showModal = true;
      component.formData = { name: 'Test' };
      component.closeModal();
      expect(component.showModal).toBeFalse();
      expect(component.formData).toEqual({});
    });
  });

  describe('askDelete', () => {
    it('should set client to delete and show delete modal', () => {
      const client = component.clients[0];
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      component.askDelete(client, event);
      expect(component.toDelete).toBe(client);
      expect(component.showDeleteModal).toBeTrue();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('confirmDelete', () => {
    it('should delete client and close modal', () => {
      const client = component.clients[0];
      component.toDelete = client;
      component.selected = client;
      const initialLength = component.clients.length;
      component.confirmDelete();
      expect(component.clients.length).toBe(initialLength - 1);
      expect(component.clients.find(c => c.id === client.id)).toBeUndefined();
      expect(component.selected).toBeNull();
      expect(component.toDelete).toBeNull();
      expect(component.showDeleteModal).toBeFalse();
    });

    it('should do nothing if no client to delete', () => {
      component.toDelete = null;
      const initialLength = component.clients.length;
      component.confirmDelete();
      expect(component.clients.length).toBe(initialLength);
    });
  });

  describe('cancelDelete', () => {
    it('should cancel delete and close modal', () => {
      component.toDelete = component.clients[0];
      component.showDeleteModal = true;
      component.cancelDelete();
      expect(component.toDelete).toBeNull();
      expect(component.showDeleteModal).toBeFalse();
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = '2023-03-10';
      const formatted = component.formatDate(date);
      expect(formatted).toBe('10 mars 2023'); // Assuming fr-TN locale
    });
  });
});
    { id:3,  name:'Alpha Logistics',       email:'ops@alphalog.tn',         phone:'+216 70 333 444', region:'Sousse',   resellerId:3, resellerName:'ConnectPro Tunis',  totalDevices:25, activeDevices:20, isActive:true,  joinDate:'2022-12-01' },
    { id:4,  name:'Ben Salem SARL',        email:'bensalem@gmail.com',      phone:'+216 74 444 555', region:'Bizerte',  resellerId:4, resellerName:'Alpha Track',       totalDevices:4,  activeDevices:2,  isActive:false, joinDate:'2024-01-20' },
    { id:5,  name:'Ferchichi Transport',   email:'info@ferchichi.tn',       phone:'+216 72 555 666', region:'Nabeul',   resellerId:5, resellerName:'GPS Tunisie',       totalDevices:15, activeDevices:14, isActive:true,  joinDate:'2023-09-05' },
    { id:6,  name:'FleetCo Tunis',         email:'fleet@fleetco.tn',        phone:'+216 71 666 777', region:'Tunis',    resellerId:6, resellerName:'FleetMaster TN',    totalDevices:32, activeDevices:30, isActive:true,  joinDate:'2022-08-14' },
    { id:7,  name:'Rekik Frères',          email:'rekik@rekikfreres.tn',    phone:'+216 75 777 888', region:'Gabès',    resellerId:7, resellerName:'IoT Gabès',          totalDevices:6,  activeDevices:5,  isActive:true,  joinDate:'2024-04-02' },
    { id:8,  name:'SudTrans',              email:'contact@sudtrans.tn',     phone:'+216 76 888 999', region:'Medenine', resellerId:8, resellerName:'TrackSud',           totalDevices:9,  activeDevices:8,  isActive:true,  joinDate:'2023-11-18' },
    { id:9,  name:'Karoui & Associés',     email:'karoui@associes.tn',      phone:'+216 71 999 000', region:'Tunis',    resellerId:1, resellerName:'TechVision SARL',  totalDevices:18, activeDevices:0,  isActive:false, joinDate:'2023-01-07' },
    { id:10, name:'Hannibal Motors',       email:'fleet@hannibalmotor.tn',  phone:'+216 73 000 111', region:'Sfax',     resellerId:2, resellerName:'NetPlus Solutions', totalDevices:22, activeDevices:19, isActive:true,  joinDate:'2022-10-25' },
    { id:11, name:'Nabeul Agri',           email:'info@nabeulAgri.tn',      phone:'+216 72 112 223', region:'Nabeul',   resellerId:5, resellerName:'GPS Tunisie',       totalDevices:5,  activeDevices:4,  isActive:true,  joinDate:'2024-02-28' },
    { id:12, name:'Monastir Shipping',     email:'ops@monastirship.tn',     phone:'+216 73 223 334', region:'Monastir', resellerId:3, resellerName:'ConnectPro Tunis',  totalDevices:11, activeDevices:9,  isActive:false, joinDate:'2023-07-10' },
  ];

  get filtered(): Client[] {
    const q = this.searchQuery.toLowerCase().trim();
    let list = [...this.clients];

    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.resellerName.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );

    if (this.filterActive === 'active')   list = list.filter(c => c.isActive);
    if (this.filterActive === 'inactive') list = list.filter(c => !c.isActive);

    list.sort((a, b) => {
      const av = a[this.sortField] ?? '';
      const bv = b[this.sortField] ?? '';
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (this.sortAsc ? 1 : -1);
    });
    return list;
  }

  sortBy(field: keyof Client): void {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else { this.sortField = field; this.sortAsc = true; }
  }

  sortIcon(field: keyof Client): string {
    if (this.sortField !== field) return '↕';
    return this.sortAsc ? '↑' : '↓';
  }

  openDetail(c: Client): void {
    this.selected = c;
    this.view = 'detail';
  }

  backToTable(): void {
    this.view = 'table';
    this.selected = null;
  }

  openAdd(): void {
    this.formData = { region: 'Tunis', isActive: true, resellerId: this.resellers[0].id, resellerName: this.resellers[0].companyName };
    this.modalMode = 'add';
    this.showModal = true;
  }

  openEdit(c: Client, e: Event): void {
    e.stopPropagation();
    this.formData = { ...c };
    this.modalMode = 'edit';
    this.showModal = true;
  }

  onResellerChange(): void {
    const r = this.resellers.find(r => r.id === Number(this.formData.resellerId));
    if (r) this.formData.resellerName = r.companyName;
  }

  saveForm(): void {
    if (this.modalMode === 'add') {
      const newId = Math.max(0, ...this.clients.map(c => c.id)) + 1;
      this.clients = [...this.clients, {
        id:            newId,
        name:          this.formData.name ?? '',
        email:         this.formData.email ?? '',
        phone:         this.formData.phone ?? '',
        region:        this.formData.region ?? 'Tunis',
        resellerId:    Number(this.formData.resellerId),
        resellerName:  this.formData.resellerName ?? '',
        totalDevices:  0,
        activeDevices: 0,
        isActive:      this.formData.isActive ?? true,
        joinDate:      new Date().toISOString().split('T')[0],
      }];
    } else {
      this.clients = this.clients.map(c =>
        c.id === this.formData.id ? { ...c, ...this.formData } as Client : c
      );
      if (this.selected?.id === this.formData.id)
        this.selected = this.clients.find(c => c.id === this.formData.id) ?? null;
    }
    this.showModal = false;
    this.formData = {};
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = {};
  }

  askDelete(c: Client, e: Event): void {
    e.stopPropagation();
    this.toDelete = c;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.toDelete) return;
    this.clients = this.clients.filter(c => c.id !== this.toDelete!.id);
    if (this.selected?.id === this.toDelete.id) this.backToTable();
    this.toDelete = null;
    this.showDeleteModal = false;
  }

  cancelDelete(): void {
    this.toDelete = null;
    this.showDeleteModal = false;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' });
  }
}