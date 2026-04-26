import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceService } from '../../../service/Device.service';
import { AbonnementService, AbonnementDTO } from '../../../service/Abonnement.service';
import { ToastService } from '../../../service/Toast.service';
import { Client } from '../../../models/client.model';
import { Device } from '../../../models/device.model';
import { Reseller } from '../../../models/reseller.model';

@Component({
  selector: 'app-reseller-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client.html',
  styleUrls: ['./client.css'],
})
export default class ResellerClientsComponent implements OnInit {

  readonly i18n           = inject(TranslationService);
  private clientService   = inject(ClientService);
  private resellerService = inject(ResellerService);
  private deviceService   = inject(DeviceService);
  private aboService      = inject(AbonnementService);
  private toastService    = inject(ToastService);

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

  search = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  isActive(c: Client): boolean { return (c.graceDaysLeft ?? 0) > 0; }
  fullName(c: Client): string  { return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(); }

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

  // ── Panel ─────────────────────────────────────────────
  panelOpen   = false;
  panelClient: Client | null = null;
  panelTab: 'profile' | 'devices' | 'operations' = 'profile';

  // Panel data
  panelDevices: Device[] = [];
  panelAbos: AbonnementDTO[] = [];
  panelDevicesLoading  = false;
  panelAbosLoading     = false;

  openPanel(c: Client) {
    this.panelClient = c;
    this.panelTab    = 'profile';
    this.panelOpen   = true;
    this.panelDevices = [];
    this.panelAbos    = [];
  }

  closePanel() { this.panelOpen = false; }

  switchPanelTab(t: 'profile' | 'devices' | 'operations') {
    this.panelTab = t;
    if (!this.panelClient) return;

    if (t === 'devices' && this.panelDevices.length === 0) {
      this.panelDevicesLoading = true;
      this.deviceService.getByClient(this.panelClient.idClient).subscribe({
        next: (data) => { this.panelDevices = data; this.panelDevicesLoading = false; },
        error: () => { this.panelDevicesLoading = false; }
      });
    }

    if (t === 'operations' && this.panelAbos.length === 0) {
      this.panelAbosLoading = true;
      this.aboService.getByClient(this.panelClient.idClient).subscribe({
        next: (data) => { this.panelAbos = data; this.panelAbosLoading = false; },
        error: () => { this.panelAbosLoading = false; }
      });
    }
  }

  deviceStatusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')  return 'dev-pill--actif';
    if (s === 'expiré') return 'dev-pill--expired';
    if (s === 'libre')  return 'dev-pill--libre';
    return 'dev-pill--inactive';
  }

  aboStatusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')  return 'abo-pill--actif';
    if (s === 'expiré') return 'abo-pill--expired';
    return 'abo-pill--inactive';
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Add / Edit / Delete ───────────────────────────────
  showModal  = false;
  showDelete = false;
  isEdit     = false;
  selected: Client | null = null;
  form: Partial<Client> = {};

  openAdd() {
    this.isEdit = false;
    this.form = { firstName: '', lastName: '', email: '', phone: '', location: 'Tunis', region: '' };
    this.showModal = true;
  }

  openEdit(c: Client) {
    this.isEdit = true; this.selected = c;
    this.form = { ...c };
    this.showModal = true; this.closePanel();
  }

  openDelete(c: Client) { this.selected = c; this.showDelete = true; this.closePanel(); }

  isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }

  getProgressWidth(a: any) {
    return Math.min((a.joursRestants / (a.dureeMois * 30)) * 100, 100);
  }
  isValidPhone(p: string) { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get formEmailError() { return (this.form.email ?? '') && !this.isValidEmail(this.form.email ?? '') ? 'msg_error_invalid_email' : ''; }
  get formPhoneError() { return (this.form.phone ?? '') && !this.isValidPhone(this.form.phone ?? '') ? 'msg_error_invalid_phone' : ''; }

  saveClient() {
    if (!this.isValidEmail(this.form.email ?? '') || !this.isValidPhone(this.form.phone ?? '')) return;

    if (this.isEdit && this.selected) {
      this.clientService.updateMyClient(this.selected.idClient, this.form).subscribe({
        next: (updated) => {
          this.clients = this.clients.map(c => c.idClient === updated.idClient ? updated : c);
          this.showModal = false;
          this.toastService.success(`${this.fullName(updated)} updated successfully`);
        },
        error: () => this.toastService.error('Failed to update client')
      });
    } else {
      this.clientService.createMyClient({
        ...this.form,
        idRev: this.reseller.idRev
      }).subscribe({
        next: (created) => {
          this.clients.push(created);
          this.showModal = false;
          this.toastService.success(`${this.fullName(created)} added successfully`);
        },
        error: () => this.toastService.error('Failed to create client')
      });
    }
  }

  confirmDelete() {
    if (!this.selected) return;
    const name = this.fullName(this.selected);
    this.clientService.delete(this.selected.idClient).subscribe({
      next: () => {
        this.clients = this.clients.filter(c => c.idClient !== this.selected!.idClient);
        this.showDelete = false;
        this.selected   = null;
        this.toastService.success(`${name} deleted`);
      },
      error: () => this.toastService.error('Failed to delete client')
    });
  }

  closeModal()  { this.showModal  = false; }
  closeDelete() { this.showDelete = false; }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  get totalCount()    { return this.clients.length; }
  get activeCount()   { return this.clients.filter(c => this.isActive(c)).length; }
  get inactiveCount() { return this.clients.filter(c => !this.isActive(c)).length; }
  initials(c: Client) { return ((c.firstName ?? '?')[0] + (c.lastName ?? '?')[0]).toUpperCase(); }
}