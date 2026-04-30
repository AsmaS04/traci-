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
      next: (r) => { this.reseller = r; },
      error: () => {}
    });
    this.clientService.getMyClients().subscribe({
      next: (data) => { this.clients = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  // ── Filters ─────────────────────────────────────────────
  search = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  isActive(c: Client)    { return (c.graceDaysLeft ?? 0) > 0; }
  fullName(c: Client)    { return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(); }
  initials(c: Client)    { return ((c.firstName ?? '?')[0] + (c.lastName ?? '?')[0]).toUpperCase(); }
  get totalCount()       { return this.clients.length; }
  get activeCount()      { return this.clients.filter(c => this.isActive(c)).length; }
  get inactiveCount()    { return this.clients.filter(c => !this.isActive(c)).length; }

  get filtered(): Client[] {
    return this.clients.filter(c => {
      const q = this.search.toLowerCase();
      const matchSearch = !q ||
        this.fullName(c).toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q);
      const status = this.isActive(c) ? 'active' : 'inactive';
      return (this.filterStatus === 'all' || status === this.filterStatus) && matchSearch;
    });
  }

  // ── Slide Panel ──────────────────────────────────────────
  panelOpen   = false;
  panelClient: Client | null = null;
  panelTab: 'profile' | 'devices' | 'operations' = 'profile';
  panelDevices: Device[] = [];
  panelAbos: AbonnementDTO[] = [];
  panelDevicesLoading  = false;
  panelAbosLoading     = false;

  openPanel(c: Client) {
    this.panelClient  = c;
    this.panelTab     = 'profile';
    this.panelOpen    = true;
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

  // ── Add / Edit / Delete ──────────────────────────────────
  showModal  = false;
  showDelete = false;
  isEdit     = false;
  selected: Client | null = null;
  form: Partial<Client> = {};

  openAdd() {
    this.isEdit = false;
    this.form   = { firstName: '', lastName: '', email: '', phone: '', location: 'Tunis', region: '' };
    this.showModal = true;
  }

  openEdit(c: Client) {
    this.isEdit = true; this.selected = c;
    this.form   = { ...c };
    this.showModal = true; this.closePanel();
  }

  openDelete(c: Client) { this.selected = c; this.showDelete = true; this.closePanel(); }

  isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
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
      this.clientService.createMyClient({ ...this.form, idRev: this.reseller.idRev }).subscribe({
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
        this.showDelete = false; this.selected = null;
        this.toastService.success(`${name} deleted`);
      },
      error: () => this.toastService.error('Failed to delete client')
    });
  }

  closeModal()  { this.showModal  = false; }
  closeDelete() { this.showDelete = false; }

  deviceStatusClass(status: string) {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')  return 'dev-pill--actif';
    if (s === 'expiré') return 'dev-pill--expired';
    if (s === 'libre')  return 'dev-pill--libre';
    return 'dev-pill--inactive';
  }

  aboStatusClass(status: string) {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')  return 'abo-pill--actif';
    if (s === 'expiré') return 'abo-pill--expired';
    return 'abo-pill--inactive';
  }

  formatDate(d: string | null | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getProgressWidth(a: AbonnementDTO) {
    return Math.min((a.joursRestants / (a.dureeMois * 30)) * 100, 100);
  }

  // ══════════════════════════════════════════════════════════
  // HYBRID ASSIGN MODAL
  // ══════════════════════════════════════════════════════════
  showAssignModal  = false;
  assignTab: 'pick' | 'count' = 'pick';           // which tab is active
  assignTargetClient: Client | null = null;

  // Shared fields
  assignDuration  = 1;
  assignPrice     = 0;

  // Tab A — Pick devices (multi-select)
  libreDevices: Device[]        = [];
  libreLoading                  = false;
  selectedDeviceIds: Set<number> = new Set();

  // Tab B — Assign by count
  assignCount     = 1;
  countPreview: Device[] = [];   // first N libre devices shown as preview

  // Progress tracking during bulk assign
  assignInProgress = false;
  assignDone       = 0;
  assignTotal      = 0;
  assignErrors     = 0;

  // ── Open / close ─────────────────────────────────────────
  openAssignModal(c: Client) {
    this.assignTargetClient   = c;
    this.assignTab            = 'pick';
    this.assignDuration       = 1;
    this.assignPrice          = 0;
    this.selectedDeviceIds    = new Set();
    this.assignCount          = 1;
    this.countPreview         = [];
    this.assignDone           = 0;
    this.assignTotal          = 0;
    this.assignErrors         = 0;
    this.assignInProgress     = false;
    this.showAssignModal      = true;
    this.loadLibreDevices();
  }

  closeAssignModal() {
    if (this.assignInProgress) return;   // block close during processing
    this.showAssignModal = false;
    this.assignTargetClient = null;
  }

  // ── Load libre devices ───────────────────────────────────
  loadLibreDevices() {
    this.libreLoading = true;
    this.deviceService.getLibreByReseller(this.reseller.idRev).subscribe({
      next: (data) => {
        this.libreDevices = data;
        this.libreLoading = false;
        this.updateCountPreview();
      },
      error: () => {
        this.libreLoading = false;
        this.toastService.error('Failed to load available devices');
      }
    });
  }

  // ── Tab A helpers ────────────────────────────────────────
  switchAssignTab(t: 'pick' | 'count') {
    this.assignTab = t;
    if (t === 'count') this.updateCountPreview();
  }

  toggleDevice(id: number) {
    if (this.selectedDeviceIds.has(id)) this.selectedDeviceIds.delete(id);
    else                                this.selectedDeviceIds.add(id);
  }

  isSelected(id: number) { return this.selectedDeviceIds.has(id); }

  toggleSelectAll() {
    if (this.selectedDeviceIds.size === this.libreDevices.length) {
      this.selectedDeviceIds = new Set();
    } else {
      this.selectedDeviceIds = new Set(this.libreDevices.map(d => d.idDevice));
    }
  }

  get allSelected()  { return this.libreDevices.length > 0 && this.selectedDeviceIds.size === this.libreDevices.length; }
  get someSelected() { return this.selectedDeviceIds.size > 0 && !this.allSelected; }

  // ── Tab B helpers ────────────────────────────────────────
  updateCountPreview() {
    this.countPreview = this.libreDevices.slice(0, Math.max(0, this.assignCount));
  }

  // ── Execute bulk assign ──────────────────────────────────
  get devicesToAssign(): Device[] {
    if (this.assignTab === 'pick') {
      return this.libreDevices.filter(d => this.selectedDeviceIds.has(d.idDevice));
    } else {
      return this.countPreview;
    }
  }

  get canAssign(): boolean {
    if (this.assignInProgress)             return false;
    if (!this.assignTargetClient)          return false;
    if (this.assignDuration < 1)           return false;
    if (this.assignPrice < 0)             return false;
    return this.devicesToAssign.length > 0;
  }

  async runBulkAssign() {
    const devices = this.devicesToAssign;
    if (!devices.length || !this.assignTargetClient) return;

    this.assignInProgress = true;
    this.assignTotal      = devices.length;
    this.assignDone       = 0;
    this.assignErrors     = 0;

    for (const device of devices) {
      try {
        await this.aboService.assignDevice(
          this.reseller.idRev,
          this.assignTargetClient.idClient,
          device.idDevice,
          this.assignDuration,
          this.assignPrice
        ).toPromise();
        this.assignDone++;
      } catch {
        this.assignErrors++;
        this.assignDone++;
      }
    }

    this.assignInProgress = false;

    const ok   = this.assignDone - this.assignErrors;
    const fail = this.assignErrors;

    if (fail === 0) {
      this.toastService.success(`${ok} device${ok > 1 ? 's' : ''} assigned successfully`);
    } else if (ok === 0) {
      this.toastService.error(`All ${fail} assignments failed`);
    } else {
      this.toastService.warning(`${ok} assigned, ${fail} failed`);
    }

    // Refresh panel devices and close
    if (this.panelClient?.idClient === this.assignTargetClient?.idClient) {
      this.panelDevices = [];
      this.switchPanelTab('devices');
    }
    this.showAssignModal = false;
    this.assignTargetClient = null;
  }

  get assignProgress(): number {
    if (!this.assignTotal) return 0;
    return Math.round((this.assignDone / this.assignTotal) * 100);
  }

  fmt(n: number) { return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0); }

}