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
import { ToastService } from '../../../service/Toast.service';
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

  private resellerService = inject(ResellerService);
  private clientService   = inject(ClientService);
  private deviceService   = inject(DeviceService);
  private router          = inject(Router);
  private http            = inject(HttpClient);
  private toast           = inject(ToastService);
  private notifWs         = inject(NotificationWebsocketService);
  public  i18n            = inject(TranslationService);

  reseller = signal<Reseller | null>(null);
  clients  = signal<Client[]>([]);
  loading  = signal(true);

  // Real device counts (from backend)
  totalDevices     = signal<number>(0);
  activeDevices    = signal<number>(0);
  offlineDevices   = signal<number>(0);

  // Commission with period filter
  commissionRange: Period = 'all';
  totalCommission = signal<number>(0);
  isCommissionLoading = signal<boolean>(false);

  // Access requests
  pendingRequests    = signal<any[]>([]);
  processingRequest  = signal<number | null>(null);
  accessRequestsCount = signal(0);

  private notifSub?: Subscription;
  readonly circumference = 2 * Math.PI * 42;
  private clientChart: ApexCharts | null = null;
  private emailCheckTimeout: any = null;

  ngOnInit() {
    this.loadDashboard();
    this.loadPendingRequests();
    this.loadCommissionTotal();

    this.notifSub = this.notifWs.resellerNotification$.subscribe((n) => {
      if (n.type === 'ACCESS_REQUEST') {
        this.accessRequestsCount.update(c => c + 1);
        this.loadPendingRequests();
      }
      if (n.type === 'COMMISSION_EARNED') {
        this.loadCommissionTotal();
        this.toast.success(`✨ New commission: ${n.detail || 'earned'}`);
      }
    });
  }

  ngOnDestroy() {
    if (this.clientChart)      this.clientChart.destroy();
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    this.notifSub?.unsubscribe();
  }

  loadDashboard() {
    this.loading.set(true);
    this.resellerService.getMyProfile().subscribe({
      next: (data: Reseller) => {
        this.reseller.set(data);
        // Load device counts after we have reseller ID
        if (data.idRev) {
          this.loadDeviceStats(data.idRev);
        }
      },
      error: (err: any) => console.error('Failed to load reseller:', err)
    });
    this.clientService.getMyClients().subscribe({
      next: (data: Client[]) => {
        this.clients.set(data);
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
        const total = devices.length;
        const active = devices.filter(d => d.status?.toLowerCase() === 'actif').length;
        const offline = devices.filter(d => 
          d.status?.toLowerCase() === 'inactif' || d.status?.toLowerCase() === 'expiré'
        ).length;
        this.totalDevices.set(total);
        this.activeDevices.set(active);
        this.offlineDevices.set(offline);
      },
      error: () => {
        this.totalDevices.set(0);
        this.activeDevices.set(0);
        this.offlineDevices.set(0);
      }
    });
  }

  loadPendingRequests() {
    this.http.get<any[]>('http://localhost:8080/api/request-access/client/pending')
      .subscribe({
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
    let params = new HttpParams().set('period', this.commissionRange);
    this.http.get<{ total: number }>('http://localhost:8080/api/reseller/commission-total', { params })
      .subscribe({
        next: (res) => {
          this.totalCommission.set(res.total);
          this.isCommissionLoading.set(false);
        },
        error: () => {
          this.totalCommission.set(0);
          this.isCommissionLoading.set(false);
        }
      });
  }

  setCommissionRange(range: Period) {
    this.commissionRange = range;
    this.loadCommissionTotal();
  }

  regeneratePassword(req: any) {
    this.processingRequest.set(req.id);
    this.http.post(`http://localhost:8080/api/request-access/regenerate-password/${req.id}`, {})
      .subscribe({
        next: () => {
          this.processingRequest.set(null);
          this.loadPendingRequests();
        },
        error: () => { this.processingRequest.set(null); }
      });
  }

  get totalClients()   { return this.reseller()?.clientCount || this.clients().length; }
  get alertsCount()    { return this.offlineDevices(); } // kept for compatibility (not used anymore)

  get stableClients(): number {
    return this.clients().filter(c => (c.graceDaysLeft ?? 0) > 0).length;
  }
  get issueClients(): number {
    return this.clients().filter(c => (c.graceDaysLeft ?? 0) <= 0).length;
  }
  get clientHealthPct(): number {
    const total = this.clients().length;
    return total > 0 ? Math.round((this.stableClients / total) * 100) : 0;
  }
  get clientHealthOffset(): number {
    const circ = 2 * Math.PI * 28;
    return circ * (1 - this.clientHealthPct / 100);
  }
  readonly healthCircumference = 2 * Math.PI * 28;

  get mostActiveClient(): string {
    const list = this.clients();
    if (!list.length) return '—';
    return `${list[0].firstName ?? ''} ${list[0].lastName ?? ''}`.trim() || '—';
  }

  initials(c: Client): string {
    return ((c.firstName ?? '?')[0] + (c.lastName ?? '?')[0]).toUpperCase();
  }
  fullName(c: Client): string {
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  }
  isActive(c: Client): boolean {
    return (c.graceDaysLeft ?? 0) > 0;
  }

  fmt(n: number) {
    return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }

  fmtInt(n: number) {
    return new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 0 }).format(n);
  }

  navigateTo(path: string) { this.router.navigate([path]); }
  navigateToInvoices()     { this.router.navigate(['/reseller-dashboard/invoices']); }

  formatReqDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-TN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  private renderClientChart() {
    const el = document.getElementById('client-status-chart');
    if (!el) return;
    if (this.clientChart) this.clientChart.destroy();

    const active   = this.stableClients;
    const inactive = this.issueClients;
    const total    = active + inactive;

    this.clientChart = new ApexCharts(el, {
      series: [active, inactive],
      colors: ['#0D9488', '#DC2626'],
      chart: { type: 'donut', height: 200, fontFamily: 'Manrope, sans-serif' },
      labels: ['Active', 'Expired'],
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true, showAlways: true, label: 'Clients',
                fontSize: '12px', fontWeight: 600, color: '#94a3b8',
                formatter: () => total.toString(),
              },
              value: { show: true, fontSize: '24px', fontWeight: 800, color: '#0f172a', offsetY: -10 }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { colors: ['transparent'] },
      legend: {
        position: 'bottom', fontSize: '12px', fontWeight: 600,
        labels: { colors: '#475569' }, markers: { size: 5 },
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return `${val} (${pct}%)`;
          }
        }
      }
    });
    this.clientChart.render();
  }

  // Add Client modal
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
        error: () => { this.addEmailExists = false; }
      });
    }, 400);
  }

  openAddClient() {
    this.addForm       = { firstName: '', lastName: '', email: '', phone: '', region: '' };
    this.addEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    this.showAddModal  = true;
  }

  saveNewClient() {
    if (!this.isValidEmail(this.addForm.email) || !this.isValidPhone(this.addForm.phone) || this.addEmailExists) return;
    this.clientService.createMyClient({
      firstName: this.addForm.firstName,
      lastName:  this.addForm.lastName,
      email:     this.addForm.email,
      phone:     this.addForm.phone,
      region:    this.addForm.region,
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
}