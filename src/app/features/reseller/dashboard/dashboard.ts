import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { DeviceService } from '../../../service/Device.service';
import { AbonnementService } from '../../../service/Abonnement.service';
import { ToastService } from '../../../service/Toast.service';
import { DeviceRequestService } from '../../../service/DeviceRequest.service';
import { NotificationWebsocketService } from '../../../service/notification-websocket.service';
import { Reseller } from '../../../models/reseller.model';
import { Client } from '../../../models/client.model';
import { Device } from '../../../models/device.model';
import ApexCharts from 'apexcharts';

type Period = 'today' | 'week' | 'month' | 'all';

@Component({
  selector: 'app-reseller-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export default class ResellerDashboardComponent implements OnInit, OnDestroy {

  private resellerService      = inject(ResellerService);
  private clientService        = inject(ClientService);
  private deviceService        = inject(DeviceService);
  private aboService           = inject(AbonnementService);
  private router               = inject(Router);
  private http                 = inject(HttpClient);
  private toast                = inject(ToastService);
  private deviceRequestService = inject(DeviceRequestService);
  private notifWs              = inject(NotificationWebsocketService);
  public  i18n                 = inject(TranslationService);

  reseller = signal<Reseller | null>(null);
  clients  = signal<Client[]>([]);
  loading  = signal(true);

  totalDevices   = signal<number>(0);
  activeDevices  = signal<number>(0);
  offlineDevices = signal<number>(0);

  // Commission
  commissionRange    : Period = 'all';
  totalCommission     = signal<number>(0);
  isCommissionLoading = signal<boolean>(false);

  // Revenue
  revenueRange    : Period = 'all';
  totalRevenue     = signal<number>(0);
  isRevenueLoading = signal<boolean>(false);

  pendingRequests     = signal<any[]>([]);
  processingRequest   = signal<number | null>(null);
  accessRequestsCount = signal(0);

  private notifSub?: Subscription;
  private clientChart: ApexCharts | null = null;
  private emailCheckTimeout: any = null;

  // ── Assign Modal ──────────────────────────────────────────────
  showAssignModal  = false;
  assignTab: 'pick' | 'count' = 'pick';
  selectedClientId: number | null = null;
  assignPrice      = 0;
  selectedDeviceIds: Set<number> = new Set();
  assignCount      = 1;
  countPreview: Device[] = [];
  assignInProgress = false;
  assignDone       = 0;
  assignTotal      = 0;
  assignErrors     = 0;
  libreDevices: Device[] = [];

  // ── Request More Devices Modal ────────────────────────────────
  showRequestModal  = false;
  requestCount      = 1;
  requestMessage    = '';
  requestSubmitting = false;

  // ── List of Tunisian governorates for the region dropdown ─────
  readonly governorates = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
    'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine',
    'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
    'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

  ngOnInit() {
    this.loadDashboard();
    this.loadPendingRequests();
    this.loadCommissionTotal();
    this.loadRevenueTotal();

    this.notifSub = this.notifWs.resellerNotification$.subscribe((n) => {
      if (n.type === 'ACCESS_REQUEST') {
        this.accessRequestsCount.update(c => c + 1);
        this.loadPendingRequests();
      }
      if (n.type === 'COMMISSION_EARNED') {
        this.loadCommissionTotal();
        this.loadRevenueTotal();
        this.toast.success(`✨ New commission: ${n.detail || 'earned'}`);
      }
    });
  }

  ngOnDestroy() {
    if (this.clientChart)       this.clientChart.destroy();
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    this.notifSub?.unsubscribe();
  }

  loadDashboard() {
    this.loading.set(true);
    this.resellerService.getMyProfile().subscribe({
      next: (data: Reseller) => {
        this.reseller.set(data);
        if (data.idRev) this.loadDeviceStats(data.idRev);
      },
      error: (err: any) => console.error('Failed to load reseller:', err)
    });
    this.clientService.getMyClients().subscribe({
      next: (data: Client[]) => {
        const sorted = [...data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.clients.set(sorted);
        this.loading.set(false);
        setTimeout(() => this.renderClientChart(), 0);
      },
      error: (err: any) => {
        console.error('Failed to load clients:', err);
        this.loading.set(false);
      }
    });
  }

  loadDeviceStats(resellerId: number) {
    this.deviceService.getByReseller(resellerId).subscribe({
      next: (devices: Device[]) => {
        this.totalDevices.set(devices.length);
        this.activeDevices.set(devices.filter(d => d.status?.toLowerCase() === 'actif').length);
        this.offlineDevices.set(devices.filter(d =>
          d.status?.toLowerCase() === 'inactif' || d.status?.toLowerCase() === 'expiré'
        ).length);
      },
      error: () => {
        this.totalDevices.set(0);
        this.activeDevices.set(0);
        this.offlineDevices.set(0);
      }
    });
  }

  loadPendingRequests() {
    this.http.get<any[]>('http://localhost:8080/api/request-access/client/pending').subscribe({
      next: (data) => {
        const pending = data.filter(r => r.status === 'PENDING');
        this.pendingRequests.set(pending);
        this.accessRequestsCount.set(pending.length);
      },
      error: () => {}
    });
  }

  loadCommissionTotal() {
    this.isCommissionLoading.set(true);
    const params = new HttpParams().set('period', this.commissionRange);
    this.http.get<{ total: number }>('http://localhost:8080/api/reseller/commission-total', { params }).subscribe({
      next: (res) => { this.totalCommission.set(res.total); this.isCommissionLoading.set(false); },
      error: ()    => { this.totalCommission.set(0);        this.isCommissionLoading.set(false); }
    });
  }

  setCommissionRange(range: Period) {
    this.commissionRange = range;
    this.loadCommissionTotal();
  }

  loadRevenueTotal() {
    this.isRevenueLoading.set(true);
    const params = new HttpParams().set('period', this.revenueRange);
    this.http.get<{ total: number }>('http://localhost:8080/api/reseller/revenue-total', { params }).subscribe({
      next: (res) => { this.totalRevenue.set(res.total); this.isRevenueLoading.set(false); },
      error: ()    => { this.totalRevenue.set(0);        this.isRevenueLoading.set(false); }
    });
  }

  setRevenueRange(range: Period) {
    this.revenueRange = range;
    this.loadRevenueTotal();
  }

  regeneratePassword(req: any) {
    this.processingRequest.set(req.id);
    this.http.post(`http://localhost:8080/api/request-access/regenerate-password/${req.id}`, {}).subscribe({
      next: () => { this.processingRequest.set(null); this.loadPendingRequests(); },
      error: ()  => { this.processingRequest.set(null); }
    });
  }

  get totalClients(): number { return this.reseller()?.clientCount || this.clients().length; }

  get latestClientName(): string {
    const list = this.clients();
    if (!list.length) return '—';
    return `${list[0].firstName ?? ''} ${list[0].lastName ?? ''}`.trim() || '—';
  }

  // ── Subscription-based client health ─────────────────────────
  isActive(c: Client): boolean {
    return c.subscriptionStatus === 'active';
  }

  get stableClients(): number {
    return this.clients().filter(c => c.subscriptionStatus === 'active').length;
  }

  get issueClients(): number {
    return this.clients().filter(c =>
      c.subscriptionStatus === 'expired' || c.subscriptionStatus === 'pending'
    ).length;
  }

  initials(c: Client): string { return ((c.firstName ?? '?')[0] + (c.lastName ?? '?')[0]).toUpperCase(); }
  fullName(c: Client): string { return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(); }

  fmt(n: number)    { return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
  fmtInt(n: number) { return new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 0 }).format(n); }

  formatReqDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' });
  }

  navigateTo(path: string) { this.router.navigate([path]); }
  navigateToInvoices()     { this.router.navigate(['/reseller-dashboard/invoices']); }

  navigateToExpiredClients() {
    this.router.navigate(['/reseller-dashboard/clients'], {
      queryParams: { filter: 'expired' }
    });
  }

  renderClientChart() {
    const el = document.getElementById('client-status-chart');
    if (!el) return;
    if (this.clientChart) { this.clientChart.destroy(); this.clientChart = null; }

    const total  = this.clients().length;
    const stable = this.stableClients;
    const issues = this.issueClients;
    if (total === 0) return;

    this.clientChart = new ApexCharts(el, {
      chart: { type: 'donut', height: 180, animations: { enabled: true, speed: 500 } },
      series: [stable, issues],
      labels: ['Active', 'Expired / Pending'],
      colors: ['#0D9488', '#DC2626'],
      plotOptions: { pie: { donut: { size: '62%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '12px', color: '#6B7280', formatter: () => String(total) } } } } },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      legend: { position: 'bottom', fontSize: '12px', fontWeight: 600, labels: { colors: '#475569' }, markers: { size: 5 } },
      tooltip: { y: { formatter: (val: number) => `${val} (${total > 0 ? ((val / total) * 100).toFixed(1) : '0'}%)` } }
    });
    this.clientChart.render();
  }

  // ── Add Client modal ──────────────────────────────────────────
  showAddModal   = false;
  addForm: any   = {};
  addEmailExists = false;

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }

  get addEmailError(): string {
    const email = this.addForm.email ?? '';
    if (!email) return '';
    if (!this.isValidEmail(email)) return 'msg_error_invalid_email';
    if (this.addEmailExists)       return 'msg_error_email_taken';
    return '';
  }

  get addPhoneError(): string {
    return (this.addForm.phone ?? '') && !this.isValidPhone(this.addForm.phone)
      ? 'msg_error_invalid_phone' : '';
  }

  onAddEmailChange() {
    this.addEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    const email = this.addForm.email ?? '';
    if (!this.isValidEmail(email)) return;
    this.emailCheckTimeout = setTimeout(() => {
      this.clientService.checkClientEmail(email).subscribe({
        next: (res) => { this.addEmailExists = res.exists; },
        error: () => {}
      });
    }, 400);
  }

  openAddClient() {
    this.addForm        = { firstName: '', lastName: '', email: '', phone: '', region: '' };
    this.addEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    this.showAddModal   = true;
  }

  saveNewClient() {
    if (!this.isValidEmail(this.addForm.email) || !this.isValidPhone(this.addForm.phone) || this.addEmailExists) return;
    this.clientService.createMyClient({
      firstName: this.addForm.firstName, lastName: this.addForm.lastName,
      email: this.addForm.email, phone: this.addForm.phone, region: this.addForm.region,
    }).subscribe({
      next: (created) => {
        this.clients.update(list => [...list, created]);
        this.showAddModal = false;
        setTimeout(() => this.renderClientChart(), 0);
      },
      error: (err: any) => console.error('Failed to create client', err)
    });
  }

  closeAddModal() {
    this.showAddModal   = false;
    this.addEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
  }

  scrollToRequests() {
    document.getElementById('access-requests-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Device Request Modal ──────────────────────────────────────
  openRequestModal()  { this.requestCount = 1; this.requestMessage = ''; this.showRequestModal = true; }
  closeRequestModal() { this.showRequestModal = false; }

  submitDeviceRequest() {
    if (!this.reseller() || this.requestCount < 1 || this.requestCount > 50) return;
    this.requestSubmitting = true;
    this.deviceRequestService.createRequest(this.reseller()!.idRev, this.requestCount, this.requestMessage).subscribe({
      next: () => {
        this.requestSubmitting = false;
        this.showRequestModal  = false;
        this.toast.success(`Request for ${this.requestCount} devices sent to admin`);
      },
      error: () => {
        this.requestSubmitting = false;
        this.toast.error('Failed to send request');
      }
    });
  }

  // ── Assign Modal ──────────────────────────────────────────────
  openAssignModal() {
    if (!this.reseller()) { this.toast.error('Reseller information not loaded'); return; }
    this.selectedClientId  = null;
    this.assignTab         = 'pick';
    this.assignPrice       = 0;
    this.selectedDeviceIds = new Set();
    this.assignCount       = 1;
    this.countPreview      = [];
    this.assignDone        = 0;
    this.assignTotal       = 0;
    this.assignErrors      = 0;
    this.assignInProgress  = false;
    this.showAssignModal   = true;
    this.deviceService.getLibreByReseller(this.reseller()!.idRev).subscribe({
      next: (data) => { this.libreDevices = data; this.updateCountPreview(); },
      error: ()     => { this.libreDevices = []; this.updateCountPreview(); }
    });
  }

  closeAssignModal() { if (this.assignInProgress) return; this.showAssignModal = false; }

  switchAssignTab(t: 'pick' | 'count') { this.assignTab = t; if (t === 'count') this.updateCountPreview(); }

  toggleDevice(id: number) {
    if (this.selectedDeviceIds.has(id)) this.selectedDeviceIds.delete(id);
    else this.selectedDeviceIds.add(id);
  }

  isSelected(id: number) { return this.selectedDeviceIds.has(id); }

  toggleSelectAll() {
    if (this.selectedDeviceIds.size === this.libreDevices.length) this.selectedDeviceIds = new Set();
    else this.selectedDeviceIds = new Set(this.libreDevices.map(d => d.idDevice));
  }

  get allSelected()  { return this.libreDevices.length > 0 && this.selectedDeviceIds.size === this.libreDevices.length; }
  get someSelected() { return this.selectedDeviceIds.size > 0 && !this.allSelected; }

  updateCountPreview() { this.countPreview = this.libreDevices.slice(0, Math.max(0, this.assignCount)); }

  get devicesToAssign(): Device[] {
    return this.assignTab === 'pick'
      ? this.libreDevices.filter(d => this.selectedDeviceIds.has(d.idDevice))
      : this.countPreview;
  }

  get canAssign(): boolean {
    return !this.assignInProgress && !!this.selectedClientId &&
           !!this.reseller() && this.assignPrice >= 0 && this.devicesToAssign.length > 0;
  }

  get assignProgress(): number {
    if (!this.assignTotal) return 0;
    return Math.round((this.assignDone / this.assignTotal) * 100);
  }

  async runBulkAssign() {
    if (!this.canAssign || !this.reseller() || !this.selectedClientId) return;
    const devices = this.devicesToAssign;
    this.assignInProgress = true;
    this.assignTotal      = devices.length;
    this.assignDone       = 0;
    this.assignErrors     = 0;

    for (const device of devices) {
      try {
        await this.aboService.assignDevice(
          this.reseller()!.idRev, this.selectedClientId,
          device.idDevice, 0, this.assignPrice
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

    if (fail === 0)    this.toast.success(`${ok} device${ok > 1 ? 's' : ''} assigned successfully`);
    else if (ok === 0) this.toast.error(`All ${fail} assignments failed`);
    else               this.toast.warning(`${ok} assigned, ${fail} failed`);

    this.showAssignModal = false;
    if (this.reseller()?.idRev) {
      this.loadDeviceStats(this.reseller()!.idRev);
      this.loadRevenueTotal();
      this.deviceService.getLibreByReseller(this.reseller()!.idRev).subscribe({
        next: (data) => { this.libreDevices = data; }
      });
    }
  }
}