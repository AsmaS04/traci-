import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { ResellerService } from '../../../service/Reseller.service';
import { Client } from '../../../models/client.model';
import { Reseller } from '../../../models/reseller.model';

@Component({
  selector: 'app-reseller-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client.html',
  styleUrls: ['./client.css'],
})
export default class ResellerClientsComponent implements OnInit {

  readonly i18n = inject(TranslationService);
  private clientService = inject(ClientService);
  private resellerService = inject(ResellerService);

  clients: Client[] = [];
  reseller: Reseller = {
    idRev: 0, username: '', email: '', nomEntreprise: '',
    deviceCostByDay: 0, daysCount: 0, phone: '', clientCount: 0, createdAt: '',
  };
  loading = true;

  ngOnInit() {
    this.resellerService.getMyProfile().subscribe({
      next: (r: Reseller) => { this.reseller = r; },
      error: (err: any) => console.error('Failed to load reseller', err)
    });
    this.clientService.getMyClients().subscribe({
      next: (data: Client[]) => { this.clients = data; this.loading = false; },
      error: (err: any) => { console.error('Failed to load clients', err); this.loading = false; }
    });
  }

  // ── Search & filter ───────────────────────────────────
  search = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  isActive(c: Client): boolean { return (c.graceDaysLeft ?? 0) > 0; }
  fullName(c: Client): string { return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(); }

  get filtered(): Client[] {
    return this.clients.filter(c => {
      const q = this.search.toLowerCase();
      const matchSearch = !q ||
        this.fullName(c).toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q);
      const status = this.isActive(c) ? 'active' : 'inactive';
      const matchStatus = this.filterStatus === 'all' || status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  // ── Slide-over panel ──────────────────────────────────
  panelOpen   = false;
  panelClient: Client | null = null;
  panelTab: 'profile' | 'devices' | 'operations' = 'profile';

  openPanel(c: Client) {
    this.panelClient = c;
    this.panelTab    = 'profile';
    this.panelOpen   = true;
  }
  closePanel() { this.panelOpen = false; }
  switchPanelTab(t: 'profile' | 'devices' | 'operations') { this.panelTab = t; }

  get panelInactive(): number { return 0; } // TODO: need device data

  // ── Add / Edit client modal ───────────────────────────
  showModal  = false;
  showDelete = false;
  isEdit     = false;
  selected: Client | null = null;
  form: Partial<Client> = {};

  openAdd() {
    this.isEdit = false;
    this.form = { firstName: '', lastName: '', email: '', phone: '', location: 'Tunis' };
    this.showModal = true;
  }

  openEdit(c: Client) {
    this.isEdit = true; this.selected = c;
    this.form = { ...c };
    this.showModal = true; this.closePanel();
  }

  openDelete(c: Client) {
    this.selected = c; this.showDelete = true; this.closePanel();
  }

  isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string) { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get formEmailError() { return (this.form.email ?? '') && !this.isValidEmail(this.form.email ?? '') ? 'msg_error_invalid_email' : ''; }
  get formPhoneError() { return (this.form.phone ?? '') && !this.isValidPhone(this.form.phone ?? '') ? 'msg_error_invalid_phone' : ''; }

  saveClient() {
    if (!this.isValidEmail(this.form.email ?? '') || !this.isValidPhone(this.form.phone ?? '')) return;
    // TODO: call backend
    this.showModal = false;
  }

  confirmDelete() {
    if (this.selected) {
      this.clients = this.clients.filter(c => c.idClient !== this.selected!.idClient);
    }
    this.showDelete = false; this.selected = null;
  }

  closeModal()  { this.showModal  = false; }
  closeDelete() { this.showDelete = false; }
  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  get totalCount()    { return this.clients.length; }
  get activeCount()   { return this.clients.filter(c => this.isActive(c)).length; }
  get inactiveCount() { return this.clients.filter(c => !this.isActive(c)).length; }
  initials(c: Client) { return ((c.firstName ?? '?')[0] + (c.lastName ?? '?')[0]).toUpperCase(); }

  // Stubs for HTML compatibility (device/transaction features not wired yet)
  devicesForClient(_id: number): any[] { return []; }
  transactionsForClient(_id: number): any[] { return []; }
  totalPaidByClient(_id: number): number { return 0; }
  deviceStatusClass(_s: string): string { return ''; }
  daysUntilExpiry(_date: string): number { return 0; }
  expiryUrgency(_date: string): string { return ''; }

  showDeviceModal = false;
  deviceForm: any = {};
  readonly deviceModels = ['ACCENT BOX', 'ACCENT MINI', 'ACCENT PRO', 'ACCENT LITE'];
  readonly simProviders = ['none', 'Ooredoo', 'Tunisie Telecom', 'Orange'];
  openAddDevice() { this.showDeviceModal = true; }
  saveDevice() { this.showDeviceModal = false; }
  closeDeviceModal() { this.showDeviceModal = false; }
}