import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../../../models/client.model';
import { Device } from '../../../models/device.model';
import { Reseller } from '../../../models/reseller.model';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceService } from '../../../service/Device.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients implements OnInit {

  constructor(
    public i18n: TranslationService,
    private clientService: ClientService,
    private resellerService: ResellerService,
    private deviceService: DeviceService
  ) {}

  view: 'table' | 'detail' = 'table';
  selected: Client | null = null;
  selectedDevices: Device[] = [];
  devicesLoading = false;

  showModal       = false;
  showDeleteModal = false;
  modalMode: 'add' | 'edit' = 'edit';
  toDelete: Client | null = null;
  formData: Partial<Client> = {};
  searchQuery = '';
  filterActive: 'all' | 'active' | 'inactive' = 'all';
  sortField: keyof Client = 'idClient';
  sortAsc = true;
  loading = true;

  readonly regions = [
    'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan',
    'Bizerte','Béja','Jendouba','Le Kef','Siliana','Sousse',
    'Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid',
    'Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kébili',
  ];

  resellers: Reseller[] = [];
  clients: Client[] = [];

  ngOnInit() {
    this.loadClients();
    this.loadResellers();
  }

  private loadClients() {
    this.loading = true;
    this.clientService.getAll().subscribe({
      next: (data) => { this.clients = data; this.loading = false; },
      error: (err) => { console.error('Failed to load clients', err); this.loading = false; }
    });
  }

  private loadResellers() {
    this.resellerService.getAll().subscribe({
      next: (data) => { this.resellers = data; },
      error: (err) => console.error('Failed to load resellers', err)
    });
  }

  isActive(c: Client): boolean { return (c.graceDaysLeft ?? 0) > 0; }
  fullName(c: Client): string  { return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(); }

  get filtered(): Client[] {
    const q = this.searchQuery.toLowerCase().trim();
    let list = [...this.clients];
    if (q) list = list.filter(c =>
      this.fullName(c).toLowerCase().includes(q) ||
      (c.resellerName ?? '').toLowerCase().includes(q) ||
      (c.location ?? '').toLowerCase().includes(q) ||
      String(c.idClient).includes(q)
    );
    if (this.filterActive === 'active')   list = list.filter(c => this.isActive(c));
    if (this.filterActive === 'inactive') list = list.filter(c => !this.isActive(c));
    list.sort((a, b) => {
      const av = (a as any)[this.sortField] ?? '';
      const bv = (b as any)[this.sortField] ?? '';
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
    this.selectedDevices = [];
    this.devicesLoading = true;
    this.deviceService.getByClient(c.idClient).subscribe({
      next: (devices) => { this.selectedDevices = devices; this.devicesLoading = false; },
      error: (err) => { console.error('Failed to load devices', err); this.devicesLoading = false; }
    });
  }

  backToTable(): void { this.view = 'table'; this.selected = null; this.selectedDevices = []; }

  openEdit(c: Client, e: Event): void {
    e.stopPropagation();
    this.formData  = { ...c };
    this.modalMode = 'edit';
    this.showModal = true;
  }

  onResellerChange(): void {
    const r = this.resellers.find(r => r.idRev === Number(this.formData.idRev));
    if (r) this.formData.resellerName = r.nomEntreprise;
  }

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get formEmailError(): string { return (this.formData.email ?? '') && !this.isValidEmail(this.formData.email ?? '') ? 'msg_error_invalid_email' : ''; }
  get formPhoneError(): string { return (this.formData.phone ?? '') && !this.isValidPhone(this.formData.phone ?? '') ? 'msg_error_invalid_phone' : ''; }

  saveForm(): void {
    if (!this.isValidEmail(this.formData.email ?? '') || !this.isValidPhone(this.formData.phone ?? '')) return;
    if (!this.formData.idClient) return;
    this.clientService.update(this.formData.idClient, this.formData).subscribe({
      next: (updated) => {
        this.loadClients();
        if (this.selected?.idClient === updated.idClient) this.selected = updated;
        this.closeModal();
      },
      error: (err) => console.error('Failed to update client', err)
    });
  }

  closeModal(): void { this.showModal = false; this.formData = {}; }

  askDelete(c: Client, e: Event): void {
    e.stopPropagation();
    this.toDelete = c;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.toDelete) return;
    this.clientService.delete(this.toDelete.idClient).subscribe({
      next: () => {
        if (this.selected?.idClient === this.toDelete!.idClient) this.backToTable();
        this.loadClients();
        this.toDelete = null;
        this.showDeleteModal = false;
      },
      error: (err) => console.error('Failed to delete client', err)
    });
  }

  cancelDelete(): void { this.toDelete = null; this.showDeleteModal = false; }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' });
  }

  // Device helpers
  deviceStatusClass(status: string | null | undefined): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')   return 'dev-status--actif';
    if (s === 'libre')   return 'dev-status--libre';
    if (s === 'expiré')  return 'dev-status--expired';
    return 'dev-status--inactive';
  }

  get activeDeviceCount()   { return this.selectedDevices.filter(d => (d.status ?? '').toLowerCase() === 'actif').length; }
  get expiredDeviceCount()  { return this.selectedDevices.filter(d => (d.status ?? '').toLowerCase() === 'expiré').length; }
  get inactiveDeviceCount() { return this.selectedDevices.filter(d => (d.status ?? '').toLowerCase() === 'inactif').length; }

  // totals
  get totalCount()    { return this.clients.length; }
  get activeCount()   { return this.clients.filter(c => this.isActive(c)).length; }
  get inactiveCount() { return this.clients.filter(c => !this.isActive(c)).length; }
}