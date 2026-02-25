import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reseller } from '../../../models/reseller.model';

@Component({
  selector: 'app-resellers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resellers.html',
  styleUrl: './resellers.css',
})
export class Resellers {

  view: 'table' | 'detail' = 'table';
  selected: Reseller | null = null;

  showModal       = false;
  showDeleteModal = false;
  modalMode: 'add' | 'edit' = 'add';
  toDelete: Reseller | null = null;
  formData: Partial<Reseller> = {};
  searchQuery = '';
  filterServer: 'all' | 'shared' | 'dedicated' = 'all';
  sortField: keyof Reseller = 'id';
  sortAsc = true;

  readonly regions = [
    'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan',
    'Bizerte','Béja','Jendouba','Le Kef','Siliana','Sousse',
    'Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid',
    'Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kébili'
  ];

  resellers: Reseller[] = [
    { id:1,  name:'Khalil Mansour',    companyName:'TechVision SARL',   email:'khalil@techvision.tn',   phone:'+216 71 234 567', address:'12 Rue de Marseille, Tunis 1000',        region:'Tunis',    serverType:'shared',    totalClients:24, clientIds:[1,2,3,4,5,6],          joinDate:'2023-02-14' },
    { id:2,  name:'Sana Trabelsi',     companyName:'NetPlus Solutions',  email:'sana@netplus.tn',        phone:'+216 73 456 789', address:'45 Avenue Habib Bourguiba, Sfax 3000',   region:'Sfax',     serverType:'dedicated', totalClients:18, clientIds:[7,8,9,10],             joinDate:'2023-05-20' },
    { id:3,  name:'Anis Belhaj',       companyName:'ConnectPro Tunis',   email:'anis@connectpro.tn',     phone:'+216 70 123 456', address:'8 Rue Ibn Khaldoun, Sousse 4000',        region:'Sousse',   serverType:'shared',    totalClients:31, clientIds:[11,12,13,14,15],       joinDate:'2022-11-08' },
    { id:4,  name:'Rim Chaabane',      companyName:'Alpha Track',        email:'rim@alphatrack.tn',      phone:'+216 74 567 890', address:'3 Rue de la République, Bizerte 7000',   region:'Bizerte',  serverType:'shared',    totalClients:9,  clientIds:[16,17,18],             joinDate:'2024-01-03' },
    { id:5,  name:'Yassine Ferchichi', companyName:'GPS Tunisie',        email:'yassine@gpstunisie.tn',  phone:'+216 72 890 123', address:'22 Avenue Farhat Hached, Nabeul 8000',   region:'Nabeul',   serverType:'dedicated', totalClients:15, clientIds:[19,20,21,22],          joinDate:'2023-08-17' },
    { id:6,  name:'Mariem Saidi',      companyName:'FleetMaster TN',     email:'mariem@fleetmaster.tn',  phone:'+216 71 345 678', address:'55 Avenue de la Liberté, Tunis 1002',    region:'Tunis',    serverType:'dedicated', totalClients:42, clientIds:[23,24,25,26,27,28,29], joinDate:'2022-07-22' },
    { id:7,  name:'Bassem Rekik',      companyName:'IoT Gabès',          email:'bassem@iotgabes.tn',     phone:'+216 75 234 567', address:'14 Rue Mongi Slim, Gabès 6000',          region:'Gabès',    serverType:'shared',    totalClients:7,  clientIds:[30,31,32],             joinDate:'2024-03-11' },
    { id:8,  name:'Imen Jebali',       companyName:'TrackSud',           email:'imen@tracksud.tn',       phone:'+216 76 678 901', address:'9 Avenue 7 Novembre, Medenine 4100',     region:'Medenine', serverType:'shared',    totalClients:11, clientIds:[33,34,35,36],          joinDate:'2023-10-05' },
    { id:9,  name:'Omar Gharbi',       companyName:'DataLink TN',        email:'omar@datalink.tn',       phone:'+216 71 901 234', address:'31 Rue Charles de Gaulle, Tunis 1001',   region:'Tunis',    serverType:'dedicated', totalClients:6,  clientIds:[37,38,39],             joinDate:'2024-05-19' },
    { id:10, name:'Faten Azizi',       companyName:'SmartFleet Sousse',  email:'faten@smartfleet.tn',    phone:'+216 73 012 345', address:'17 Avenue Taïeb Mhiri, Sousse 4001',     region:'Sousse',   serverType:'shared',    totalClients:20, clientIds:[40,41,42,43,44],       joinDate:'2023-01-30' },
  ];

  get filtered(): Reseller[] {
    const q = this.searchQuery.toLowerCase().trim();
    let list = [...this.resellers];

    if (q) list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.companyName.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q) ||
      String(r.id).includes(q)
    );

    if (this.filterServer !== 'all')
      list = list.filter(r => r.serverType === this.filterServer);

    list.sort((a, b) => {
      const av = a[this.sortField] ?? '';
      const bv = b[this.sortField] ?? '';
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (this.sortAsc ? 1 : -1);
    });
    return list;
  }

  sortBy(field: keyof Reseller): void {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else { this.sortField = field; this.sortAsc = true; }
  }

  sortIcon(field: keyof Reseller): string {
    if (this.sortField !== field) return '↕';
    return this.sortAsc ? '↑' : '↓';
  }

  openDetail(r: Reseller): void {
    this.selected = r;
    this.view = 'detail';
  }

  backToTable(): void {
    this.view = 'table';
    this.selected = null;
  }

  openAdd(): void {
    this.formData = { region: 'Tunis', serverType: 'shared', clientIds: [] };
    this.modalMode = 'add';
    this.showModal = true;
  }

  openEdit(r: Reseller, e: Event): void {
    e.stopPropagation();
    this.formData = { ...r, clientIds: [...r.clientIds] };
    this.modalMode = 'edit';
    this.showModal = true;
  }

  saveForm(): void {
    if (this.modalMode === 'add') {
      const newId = Math.max(0, ...this.resellers.map(r => r.id)) + 1;
      this.resellers = [...this.resellers, {
        id:           newId,
        name:         this.formData.name ?? '',
        companyName:  this.formData.companyName ?? '',
        email:        this.formData.email ?? '',
        phone:        this.formData.phone ?? '',
        address:      this.formData.address ?? '',
        region:       this.formData.region ?? 'Tunis',
        serverType:   this.formData.serverType ?? 'shared',
        totalClients: 0,
        clientIds:    [],
        joinDate:     new Date().toISOString().split('T')[0],
      }];
    } else {
      this.resellers = this.resellers.map(r =>
        r.id === this.formData.id ? { ...r, ...this.formData } as Reseller : r
      );
      if (this.selected?.id === this.formData.id)
        this.selected = this.resellers.find(r => r.id === this.formData.id) ?? null;
    }
    this.showModal = false;
    this.formData = {};
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = {};
  }

  askDelete(r: Reseller, e: Event): void {
    e.stopPropagation();
    this.toDelete = r;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.toDelete) return;
    this.resellers = this.resellers.filter(r => r.id !== this.toDelete!.id);
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