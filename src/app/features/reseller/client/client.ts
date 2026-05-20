import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceService } from '../../../service/Device.service';
import { AbonnementService, AbonnementDTO } from '../../../service/Abonnement.service';
import { ToastService } from '../../../service/Toast.service';
import { DeviceRequestService } from '../../../service/DeviceRequest.service';
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
export default class ResellerClientsComponent implements OnInit, OnDestroy {

  readonly i18n               = inject(TranslationService);
  private clientService       = inject(ClientService);
  private resellerService     = inject(ResellerService);
  private deviceService       = inject(DeviceService);
  private aboService          = inject(AbonnementService);
  private toastService        = inject(ToastService);
  private deviceRequestService = inject(DeviceRequestService);

  clients: Client[] = [];
  reseller: Reseller = {
    idRev: 0, username: '', email: '', nomEntreprise: '',
    deviceCostByDay: 0, daysCount: 0, phone: '', clientCount: 0, createdAt: '',
  };
  loading = true;

  private emailCheckTimeout: any = null;
  formEmailExists  = false;
  formTouched      = false;
  private originalEmail = '';

  // List of Tunisian governorates for the region dropdown
  readonly governorates = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
    'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine',
    'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
    'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

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

  ngOnDestroy() {
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
  }

  // ── Filters ─────────────────────────────────────────────
  search = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  isActive(c: Client): boolean { return c.subscriptionStatus === 'active'; }
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
  panelTab: 'profile' | 'devices' | 'subscriptions' = 'profile';
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

  isSuspended(c: Client): boolean { return c.status === 'SUSPENDED'; }

  suspendPanelClient() {
    if (!this.panelClient) return;
    this.clientService.suspendMyClient(this.panelClient.idClient).subscribe({
      next: (updated) => {
        this.panelClient = updated;
        this.clients = this.clients.map(c => c.idClient === updated.idClient ? updated : c);
        this.toastService.success(`${this.fullName(updated)} suspended successfully`);
      },
      error: () => this.toastService.error('Failed to suspend client')
    });
  }

  reactivatePanelClient() {
    if (!this.panelClient) return;
    this.clientService.reactivateMyClient(this.panelClient.idClient).subscribe({
      next: (updated) => {
        this.panelClient = updated;
        this.clients = this.clients.map(c => c.idClient === updated.idClient ? updated : c);
        this.toastService.success(`${this.fullName(updated)} reactivated successfully`);
      },
      error: () => this.toastService.error('Failed to reactivate client')
    });
  }

  switchPanelTab(t: 'profile' | 'devices' | 'subscriptions') {
    this.panelTab = t;
    if (!this.panelClient) return;
    if (t === 'devices' && this.panelDevices.length === 0) {
      this.panelDevicesLoading = true;
      this.deviceService.getByClient(this.panelClient.idClient).subscribe({
        next: (data) => { this.panelDevices = data; this.panelDevicesLoading = false; },
        error: () => { this.panelDevicesLoading = false; }
      });
    }
    if (t === 'subscriptions' && this.panelAbos.length === 0) {
      this.panelAbosLoading = true;
      this.aboService.getByClient(this.panelClient.idClient).subscribe({
        next: (data) => { this.panelAbos = data; this.panelAbosLoading = false; },
        error: () => { this.panelAbosLoading = false; }
      });
    }
  }

  // ── Add / Edit ───────────────────────────────────────────
  showModal  = false;
  isEdit     = false;
  selected: Client | null = null;
  form: Partial<Client> = {};

  openAdd() {
    this.isEdit          = false;
    this.form            = { firstName: '', lastName: '', email: '', phone: '', location: 'Tunis', region: '' };
    this.formEmailExists = false;
    this.formTouched     = false;
    this.originalEmail   = '';
    this.showModal       = true;
  }

  openEdit(c: Client) {
    this.isEdit          = true;
    this.selected        = c;
    this.form            = { ...c };
    this.originalEmail   = c.email ?? '';
    this.formEmailExists = false;
    this.formTouched     = false;
    this.showModal       = true;
    this.closePanel();
  }

  isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string) { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }

  get formEmailError(): string {
    const email = this.form.email ?? '';
    if (!email) return '';
    if (!this.isValidEmail(email)) return 'msg_error_invalid_email';
    if (this.formEmailExists) return 'msg_error_email_taken';
    return '';
  }

  get formPhoneError(): string {
    return (this.form.phone ?? '') && !this.isValidPhone(this.form.phone ?? '') ? 'msg_error_invalid_phone' : '';
  }

  isFormValid(): boolean {
    return !!(this.form.firstName?.trim())
        && !!(this.form.lastName?.trim())
        && this.isValidEmail(this.form.email ?? '')
        && !this.formEmailExists
        && this.isValidPhone(this.form.phone ?? '')
        && !!(this.form.location);
  }

  onEmailChange(): void {
    this.formEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    const email = this.form.email ?? '';
    if (!this.isValidEmail(email)) return;
    if (this.isEdit && email.trim().toLowerCase() === this.originalEmail.trim().toLowerCase()) return;

    this.emailCheckTimeout = setTimeout(() => {
      this.clientService.checkClientEmail(email).subscribe({
        next: (res) => { this.formEmailExists = res.exists; },
        error: () => { this.formEmailExists = false; }
      });
    }, 400);
  }

  saveClient() {
    this.formTouched = true;
    if (!this.isFormValid()) return;

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

  closeModal() {
    this.showModal       = false;
    this.formEmailExists = false;
    this.formTouched     = false;
    this.originalEmail   = '';
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
  }

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

  // ── Device Request Modal (keep) ──────────────────────────────────
  showRequestModal   = false;
  requestCount       = 1;
  requestMessage     = '';
  requestSubmitting  = false;

  openRequestModal() {
    this.requestCount    = 1;
    this.requestMessage  = '';
    this.showRequestModal = true;
  }

  closeRequestModal() { this.showRequestModal = false; }

  submitDeviceRequest() {
    if (this.requestCount < 1 || this.requestCount > 50) return;
    this.requestSubmitting = true;

    this.deviceRequestService.createRequest(
      this.reseller.idRev,
      this.requestCount,
      this.requestMessage
    ).subscribe({
      next: () => {
        this.requestSubmitting  = false;
        this.showRequestModal   = false;
        this.toastService.success(`Request for ${this.requestCount} devices sent to admin`);
      },
      error: () => {
        this.requestSubmitting = false;
        this.toastService.error('Failed to send request');
      }
    });
  }

  fmt(n: number) {
    return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);
  }

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