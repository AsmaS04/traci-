import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../../../models/client.model';
import { Reseller } from '../../../models/reseller.model';
import { TranslationService } from '../../../service/translation.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients {

  constructor(public i18n: TranslationService) {}

  view: 'table' | 'detail' = 'table';
  selected: Client | null = null;

  showModal       = false;
  showDeleteModal = false;
  modalMode: 'add' | 'edit' = 'add';
  toDelete: Client | null = null;
  formData: Partial<Client> = {};
  searchQuery = '';
  filterActive: 'all' | 'active' | 'inactive' = 'all';
  sortField: keyof Client = 'id';
  sortAsc = true;

  readonly regions = [
    'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan',
    'Bizerte','Béja','Jendouba','Le Kef','Siliana','Sousse',
    'Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid',
    'Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kébili',
  ];

  readonly resellers: Pick<Reseller, 'id' | 'name' | 'companyName'>[] = [
    { id:1, name:'Khalil Mansour',    companyName:'TechVision SARL'  },
    { id:2, name:'Sana Trabelsi',     companyName:'NetPlus Solutions' },
    { id:3, name:'Anis Belhaj',       companyName:'ConnectPro Tunis'  },
    { id:4, name:'Rim Chaabane',      companyName:'Alpha Track'       },
    { id:5, name:'Yassine Ferchichi', companyName:'GPS Tunisie'       },
    { id:6, name:'Mariem Saidi',      companyName:'FleetMaster TN'    },
    { id:7, name:'Bassem Rekik',      companyName:'IoT Gabès'         },
    { id:8, name:'Imen Jebali',       companyName:'TrackSud'          },
  ];

  clients: Client[] = [
    { id:1,  name:'Société Elyes',       email:'contact@elyes.tn',       phone:'+216 71 111 222', region:'Tunis',    resellerId:1, resellerName:'TechVision SARL',  totalDevices:12, activeDevices:10, isActive:true,  joinDate:'2023-03-10' },
    { id:2,  name:'Transport Mrad',      email:'info@transportmrad.tn',  phone:'+216 73 222 333', region:'Sfax',     resellerId:2, resellerName:'NetPlus Solutions', totalDevices:8,  activeDevices:7,  isActive:true,  joinDate:'2023-06-15' },
    { id:3,  name:'Alpha Logistics',     email:'ops@alphalog.tn',        phone:'+216 70 333 444', region:'Sousse',   resellerId:3, resellerName:'ConnectPro Tunis',  totalDevices:25, activeDevices:20, isActive:true,  joinDate:'2022-12-01' },
    { id:4,  name:'Ben Salem SARL',      email:'bensalem@gmail.com',     phone:'+216 74 444 555', region:'Bizerte',  resellerId:4, resellerName:'Alpha Track',       totalDevices:4,  activeDevices:2,  isActive:false, joinDate:'2024-01-20' },
    { id:5,  name:'Ferchichi Transport', email:'info@ferchichi.tn',      phone:'+216 72 555 666', region:'Nabeul',   resellerId:5, resellerName:'GPS Tunisie',       totalDevices:15, activeDevices:14, isActive:true,  joinDate:'2023-09-05' },
    { id:6,  name:'FleetCo Tunis',       email:'fleet@fleetco.tn',       phone:'+216 71 666 777', region:'Tunis',    resellerId:6, resellerName:'FleetMaster TN',    totalDevices:32, activeDevices:30, isActive:true,  joinDate:'2022-08-14' },
    { id:7,  name:'Rekik Frères',        email:'rekik@rekikfreres.tn',   phone:'+216 75 777 888', region:'Gabès',    resellerId:7, resellerName:'IoT Gabès',         totalDevices:6,  activeDevices:5,  isActive:true,  joinDate:'2024-04-02' },
    { id:8,  name:'SudTrans',            email:'contact@sudtrans.tn',    phone:'+216 76 888 999', region:'Medenine', resellerId:8, resellerName:'TrackSud',           totalDevices:9,  activeDevices:8,  isActive:true,  joinDate:'2023-11-18' },
    { id:9,  name:'Karoui & Associés',   email:'karoui@associes.tn',     phone:'+216 71 999 000', region:'Tunis',    resellerId:1, resellerName:'TechVision SARL',  totalDevices:18, activeDevices:0,  isActive:false, joinDate:'2023-01-07' },
    { id:10, name:'Hannibal Motors',     email:'fleet@hannibalmotor.tn', phone:'+216 73 000 111', region:'Sfax',     resellerId:2, resellerName:'NetPlus Solutions', totalDevices:22, activeDevices:19, isActive:true,  joinDate:'2022-10-25' },
    { id:11, name:'Nabeul Agri',         email:'info@nabeulAgri.tn',     phone:'+216 72 112 223', region:'Nabeul',   resellerId:5, resellerName:'GPS Tunisie',       totalDevices:5,  activeDevices:4,  isActive:true,  joinDate:'2024-02-28' },
    { id:12, name:'Monastir Shipping',   email:'ops@monastirship.tn',    phone:'+216 73 223 334', region:'Monastir', resellerId:3, resellerName:'ConnectPro Tunis',  totalDevices:11, activeDevices:9,  isActive:false, joinDate:'2023-07-10' },
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

  openDetail(c: Client): void { this.selected = c; this.view = 'detail'; }
  backToTable(): void         { this.view = 'table'; this.selected = null; }

  openAdd(): void {
    this.formData  = { region: 'Tunis', isActive: true, resellerId: this.resellers[0].id, resellerName: this.resellers[0].companyName };
    this.modalMode = 'add';
    this.showModal = true;
  }

  openEdit(c: Client, e: Event): void {
    e.stopPropagation();
    this.formData  = { ...c };
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
        name:          this.formData.name         ?? '',
        email:         this.formData.email        ?? '',
        phone:         this.formData.phone        ?? '',
        region:        this.formData.region       ?? 'Tunis',
        resellerId:    Number(this.formData.resellerId),
        resellerName:  this.formData.resellerName ?? '',
        totalDevices:  0,
        activeDevices: 0,
        isActive:      this.formData.isActive     ?? true,
        joinDate:      new Date().toISOString().split('T')[0],
      }];
    } else {
      this.clients = this.clients.map(c =>
        c.id === this.formData.id ? { ...c, ...this.formData } as Client : c
      );
      if (this.selected?.id === this.formData.id)
        this.selected = this.clients.find(c => c.id === this.formData.id) ?? null;
    }
    this.closeModal();
  }

  closeModal(): void { this.showModal = false; this.formData = {}; }

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

  cancelDelete(): void { this.toDelete = null; this.showDeleteModal = false; }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' });
  }
}