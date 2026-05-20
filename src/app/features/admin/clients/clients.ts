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
import { AbonnementService, AbonnementDTO } from '../../../service/Abonnement.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.html',
  styleUrls: ['./clients.css'],
})
export class Clients implements OnInit {

  constructor(
    public i18n: TranslationService,
    private clientService: ClientService,
    private resellerService: ResellerService,
    private deviceService: DeviceService,
    private aboService: AbonnementService
  ) {}

  view: 'table' | 'detail' = 'table';
  selected: Client | null = null;
  selectedDevices: Device[] = [];
  devicesLoading = false;

  // Subscriptions tab
  panelSubscriptions: AbonnementDTO[] = [];
  panelSubscriptionsLoading = false;
  panelTab: 'devices' | 'subscriptions' = 'devices';

  showModal       = false;
  modalMode: 'add' | 'edit' = 'edit';
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
  formTouched = false;

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

  isActive(c: Client): boolean    {  return c.subscriptionStatus === 'active';  }
  isSuspended(c: Client): boolean { return c.status === 'SUSPENDED'; }
  fullName(c: Client): string     { return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(); }

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
    this.panelTab = 'devices';
    this.selectedDevices = [];
    this.panelSubscriptions = [];
    this.devicesLoading = true;
    this.deviceService.getByClient(c.idClient).subscribe({
      next: (devices) => { this.selectedDevices = devices; this.devicesLoading = false; },
      error: (err) => { console.error('Failed to load devices', err); this.devicesLoading = false; }
    });
  }

  backToTable(): void { this.view = 'table'; this.selected = null; this.selectedDevices = []; this.panelSubscriptions = []; }

  switchPanelTab(tab: 'devices' | 'subscriptions') {
    this.panelTab = tab;
    if (!this.selected) return;
    if (tab === 'subscriptions' && this.panelSubscriptions.length === 0) {
      this.panelSubscriptionsLoading = true;
      this.aboService.getByClient(this.selected.idClient).subscribe({
        next: (subs) => { this.panelSubscriptions = subs; this.panelSubscriptionsLoading = false; },
        error: () => { this.panelSubscriptionsLoading = false; }
      });
    }
  }

  openEdit(c: Client, e: Event): void {
    e.stopPropagation();
    this.formData    = { ...c };
    this.formTouched = false;
    this.modalMode   = 'edit';
    this.showModal   = true;
  }

  onResellerChange(): void {
    const r = this.resellers.find(r => r.idRev === Number(this.formData.idRev));
    if (r) this.formData.resellerName = r.nomEntreprise;
  }

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get formEmailError(): string { return (this.formData.email ?? '') && !this.isValidEmail(this.formData.email ?? '') ? 'msg_error_invalid_email' : ''; }
  get formPhoneError(): string { return (this.formData.phone ?? '') && !this.isValidPhone(this.formData.phone ?? '') ? 'msg_error_invalid_phone' : ''; }

  isFormValid(): boolean {
    return !!(this.formData.firstName?.trim())
        && !!(this.formData.lastName?.trim())
        && this.isValidEmail(this.formData.email ?? '')
        && this.isValidPhone(this.formData.phone ?? '')
        && !!(this.formData.location);
  }

  saveForm(): void {
    this.formTouched = true;
    if (!this.isFormValid()) return;
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

  closeModal(): void { this.showModal = false; this.formData = {}; this.formTouched = false; }

  suspendClient(c: Client, e: Event): void {
    e.stopPropagation();
    this.clientService.suspend(c.idClient).subscribe({
      next: (updated) => {
        const idx = this.clients.findIndex(x => x.idClient === updated.idClient);
        if (idx !== -1) this.clients[idx] = updated;
        if (this.selected?.idClient === updated.idClient) this.selected = updated;
      },
      error: (err) => console.error('Failed to suspend client', err)
    });
  }

  reactivateClient(c: Client, e: Event): void {
    e.stopPropagation();
    this.clientService.reactivate(c.idClient).subscribe({
      next: (updated) => {
        const idx = this.clients.findIndex(x => x.idClient === updated.idClient);
        if (idx !== -1) this.clients[idx] = updated;
        if (this.selected?.idClient === updated.idClient) this.selected = updated;
      },
      error: (err) => console.error('Failed to reactivate client', err)
    });
  }

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

  get activeDeviceCount(): number {
    return this.selectedDevices.filter(d => (d.status ?? '').toLowerCase() === 'actif').length;
  }
  get expiredDeviceCount(): number {
    return this.selectedDevices.filter(d => (d.status ?? '').toLowerCase() === 'expiré').length;
  }
  get inactiveDeviceCount(): number {
    return this.selectedDevices.filter(d => (d.status ?? '').toLowerCase() === 'inactif').length;
  }

  // Subscription helpers
  fmt(n: number): string {
    return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }

  getProgressWidth(a: AbonnementDTO): number {
    const daysUsed = a.dureeMois * 30 - a.joursRestants;
    const percent = (daysUsed / (a.dureeMois * 30)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  }

  aboStatusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')   return 'abo-pill--actif';
    if (s === 'expiré')  return 'abo-pill--expired';
    return 'abo-pill--inactive';
  }

  // totals
  get totalCount(): number   { return this.clients.length; }
  get activeCount(): number  { return this.clients.filter(c => this.isActive(c)).length; }
  get inactiveCount(): number { return this.clients.filter(c => !this.isActive(c)).length; }

  // ── Pagination ──────────────────────────────────────────
  currentPage = 1;
  pageSize    = 10;

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }

  get paginated(): Client[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get pageNumbers(): (number | '...')[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (this.currentPage <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (this.currentPage >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
    return [1, '...', this.currentPage-1, this.currentPage, this.currentPage+1, '...', total];
  }

  goToPage(p: number | '...'): void { if (p !== '...') this.currentPage = p as number; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  onPageSizeChange(): void { this.currentPage = 1; }
}