import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { AdminService } from '../../../service/Admin.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceRequestService } from '../../../service/DeviceRequest.service';
import { Reseller } from '../../../models/reseller.model';
import ApexCharts from 'apexcharts';
import { NotificationWebsocketService, AppNotification } from '../../../service/notification-websocket.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

interface SystemEvent {
  time: string;
  type: 'reseller' | 'client' | 'device' | 'admin';
  label: string;
  detail: string;
}

interface AlertEntry {
  severity: 'critical' | 'warning';
  label: string;
  detail: string;
  route: string;
}

interface TopReseller {
  rank: number;
  name: string;
  clients: number;
  devices: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class Dashboard implements OnInit, OnDestroy {

  private donutChart: ApexCharts | null = null;
  private areaChart:  ApexCharts | null = null;
  private refreshInterval: any = null;
  private notifSub!: Subscription;
  private emailCheckTimeout: any = null;

  constructor(
    private router: Router,
    public i18n: TranslationService,
    private adminService: AdminService,
    private resellerService: ResellerService,
    private deviceRequestService: DeviceRequestService,
    private notifWs: NotificationWebsocketService,
    private http: HttpClient
  ) {}

  totalResellers    = 0;
  totalClients      = 0;
  criticalIssues    = 0;
  loading           = true;

  devActive         = 0;
  devOffline        = 0;
  devExpiring       = 0;
  devTotal          = 0;

  newResellersMonth = 0;
  newClientsMonth   = 0;

  // Real revenue from database
  totalRevenueMonth   = 0;
  totalRevenueAllTime = 0;
  revenueGrowthPct    = '0%';
  revenueByReseller: { name: string; amount: number; pct: number }[] = [];

  // Daily and yearly revenue
  dailyRevenue = 0;
  yearlyRevenue = 0;

  // Active subscriptions (corrected)
  activeSubscriptions = 0;

  alertEntries: AlertEntry[]  = [];
  topResellers: TopReseller[] = [];
  systemEvents: SystemEvent[] = [];

  showAddReseller     = false;
  resellerForm: any   = {};
  resellerEmailExists = false;

  pendingRequests   = signal<any[]>([]);
  processingRequest = signal<number | null>(null);

  // Net revenue (93% of gross, after 7% commission)
  get netRevenueMonth(): number {
    return this.totalRevenueMonth * 0.93;
  }

  get netRevenueAllTime(): number {
    return this.totalRevenueAllTime * 0.93;
  }

  ngOnInit() {
    this.loadAll();
    this.refreshInterval = setInterval(() => this.loadAll(), 30000);

    this.notifSub = this.notifWs.notification$.subscribe((n: AppNotification) => {
      const type = n.type as string;
      const now  = new Date();
      const t    = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

      this.systemEvents.unshift({
        time:   t,
        type:   this.evtTypeMap(type),
        label:  (n as any).label  ?? type,
        detail: (n as any).detail ?? (n as any).message ?? '',
      });
      if (this.systemEvents.length > 50) this.systemEvents.pop();

      if (['NEW_CLIENT', 'NEW_RESELLER', 'DEVICE_ASSIGNED', 'NEW_DEVICE_REQUEST'].includes(type)) {
        this.loadDashboard();
        this.loadResellers();
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    if (this.donutChart) this.donutChart.destroy();
    if (this.areaChart)  this.areaChart.destroy();
    this.notifSub?.unsubscribe();
  }

  private loadAll() {
    this.loadDashboard();
    this.loadResellers();
    this.loadPendingRequests();
    this.loadRevenueStats();
    this.loadRevenueByReseller();
    this.loadDailyRevenue();
    this.loadYearlyRevenue();
    this.loadActiveSubscriptions();
  }

  private loadDashboard() {
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.totalResellers    = stats['totalResellers']    ?? 0;
        this.totalClients      = stats['totalClients']      ?? 0;
        this.devTotal          = stats['totalDevices']      ?? 0;
        this.devActive         = stats['activeDevices']     ?? 0;
        this.devOffline        = stats['offlineDevices']    ?? 0;
        this.devExpiring       = stats['expiringDevices']   ?? 0;
        this.criticalIssues    = this.devOffline;
        this.newResellersMonth = stats['newResellersMonth'] ?? 0;
        this.newClientsMonth   = stats['newClientsMonth']   ?? 0;
        this.loading           = false;
        this.renderDonutChart();
      },
      error: () => { this.loading = false; }
    });

    this.adminService.getEvents().subscribe({
      next: (events) => {
        this.systemEvents = events.map(e => ({
          time:   new Date(e.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          type:   this.evtTypeMap(e.type),
          label:  e.label,
          detail: e.detail ?? '',
        }));
      },
      error: (err) => console.error('Failed to load events', err)
    });
  }

  private loadRevenueStats() {
    this.adminService.getRevenueStats().subscribe({
      next: (stats) => {
        this.totalRevenueMonth = stats.currentMonth;
        this.totalRevenueAllTime = stats.allTime;
        const prev = stats.previousMonth;
        if (prev > 0) {
          const growth = ((stats.currentMonth - prev) / prev) * 100;
          this.revenueGrowthPct = (growth > 0 ? '+' : '') + growth.toFixed(1) + '%';
        } else {
          this.revenueGrowthPct = stats.currentMonth > 0 ? '+100%' : '0%';
        }
      },
      error: () => {}
    });
  }

  private loadRevenueByReseller() {
    this.adminService.getRevenueByReseller().subscribe({
      next: (data) => { this.revenueByReseller = data; },
      error: () => { this.revenueByReseller = []; }
    });
  }

  private loadDailyRevenue() {
    this.http.get<{ daily: number }>('http://localhost:8080/api/admin/revenue/daily')
      .subscribe({
        next: (res) => this.dailyRevenue = res.daily,
        error: () => this.dailyRevenue = 0
      });
  }

  private loadYearlyRevenue() {
    this.http.get<{ yearly: number }>('http://localhost:8080/api/admin/revenue/yearly')
      .subscribe({
        next: (res) => this.yearlyRevenue = res.yearly,
        error: () => this.yearlyRevenue = 0
      });
  }

  private loadActiveSubscriptions() {
    this.http.get<number>('http://localhost:8080/api/admin/subscriptions/active')
      .subscribe({
        next: (count) => this.activeSubscriptions = count,
        error: () => this.activeSubscriptions = 0
      });
  }

  private loadResellers() {
    this.resellerService.getAll().subscribe({
      next: (resellers: Reseller[]) => {
        const sorted = [...resellers].sort((a, b) => (b.clientCount ?? 0) - (a.clientCount ?? 0));
        this.topResellers = sorted.slice(0, 5).map((r, i) => ({
          rank:    i + 1,
          name:    r.nomEntreprise || r.username || '—',
          clients: r.clientCount ?? 0,
          devices: (r as any).deviceCount ?? 0,
        }));

        const inactiveCount = resellers.filter(r => (r.clientCount ?? 0) === 0).length;
        this.alertEntries = [];

        if (inactiveCount > 0) {
          this.alertEntries.push({
            severity: 'warning',
            label:    `${inactiveCount} reseller(s) with 0 clients`,
            detail:   'No activity — follow up needed',
            route:    '/admin/resellers',
          });
        }

        if (this.devExpiring > 0) {
          this.alertEntries.push({
            severity: 'critical',
            label:    `${this.devExpiring} subscription(s) expiring soon`,
            detail:   'Client renewals required',
            route:    '/admin/devices',
          });
        }

        this.deviceRequestService.getPendingRequests().subscribe({
          next: (requests) => {
            if (requests.length > 0) {
              this.alertEntries.push({
                severity: 'warning',
                label:    `${requests.length} pending device request(s)`,
                detail:   'Resellers are waiting for devices',
                route:    '/admin/devices',
              });
            }
          },
          error: () => {}
        });
      },
      error: (err) => console.error('Failed to load resellers', err)
    });
  }

  private evtTypeMap(type: string): 'reseller' | 'client' | 'device' | 'admin' {
    if (type.includes('RESELLER')) return 'reseller';
    if (type.includes('CLIENT'))   return 'client';
    if (type.includes('DEVICE'))   return 'device';
    if (type === 'ACCESS_REQUEST') return 'admin';
    return 'admin';
  }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  fmtCurrency(n: number) { return `${new Intl.NumberFormat('fr-FR').format(n)} TND`; }
  navigateTo(p: string) { this.router.navigate([p]); }
  evtClass(t: string) {
    return t === 'reseller' ? 'ev--teal' : t === 'client' ? 'ev--blue' : t === 'device' ? 'ev--amber' : 'ev--purple';
  }

  // ── Add reseller modal methods ─────────────────────────────────
  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }

  get resellerEmailError(): string {
    const email = this.resellerForm.email ?? '';
    if (!email) return '';
    if (!this.isValidEmail(email)) return 'msg_error_invalid_email';
    if (this.resellerEmailExists) return 'msg_error_email_taken';
    return '';
  }

  get resellerPhoneError(): string {
    return (this.resellerForm.phone ?? '') && !this.isValidPhone(this.resellerForm.phone)
      ? 'msg_error_invalid_phone' : '';
  }

  onResellerEmailChange() {
    this.resellerEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    const email = this.resellerForm.email ?? '';
    if (!this.isValidEmail(email)) return;
    this.emailCheckTimeout = setTimeout(() => {
      this.resellerService.checkEmail(email).subscribe({
        next: (res) => { this.resellerEmailExists = res.exists; },
        error: () => { this.resellerEmailExists = false; }
      });
    }, 400);
  }

  openAddReseller() {
    this.resellerForm       = { username: '', nomEntreprise: '', email: '', phone: '', location: '' };
    this.resellerEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    this.showAddReseller = true;
  }

  closeAddReseller() {
    this.showAddReseller    = false;
    this.resellerEmailExists = false;
  }

  saveReseller() {
    if (
      !this.isValidEmail(this.resellerForm.email) ||
      !this.isValidPhone(this.resellerForm.phone) ||
      this.resellerEmailExists
    ) return;

    this.resellerService.create({
      username:      this.resellerForm.username,
      nomEntreprise: this.resellerForm.nomEntreprise,
      email:         this.resellerForm.email,
      phone:         this.resellerForm.phone,
      location:      this.resellerForm.location,
    }).subscribe({
      next: () => { this.loadAll(); this.showAddReseller = false; },
      error: (err) => console.error('Failed to create reseller', err)
    });
  }

  // ── Charts ────────────────────────────────────────────────────
  private renderDonutChart() {
    this.adminService.getDeviceStatus().subscribe({
      next: (data) => {
        const active   = data['active']   ?? 0;
        const offline  = data['offline']  ?? 0;
        const expiring = data['expiring'] ?? 0;
        const total    = active + offline + expiring;

        const el = document.getElementById('donut-chart');
        if (!el) return;
        if (this.donutChart) this.donutChart.destroy();

        this.donutChart = new ApexCharts(el, {
          series: [active, offline, expiring],
          colors: ['#0D9488', '#DC2626', '#F59E0B'],
          chart: { height: 280, width: '100%', type: 'donut', fontFamily: 'Manrope, sans-serif' },
          stroke: { colors: ['transparent'] },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name:  { show: true, offsetY: 20, fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, color: '#94a3b8' },
                  total: { showAlways: true, show: true, label: 'Total Devices', fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, color: '#94a3b8', formatter: () => total.toLocaleString() },
                  value: { show: true, fontFamily: 'Manrope, sans-serif', fontSize: '28px', fontWeight: 800, color: '#0f172a', offsetY: -20, formatter: (val: string) => parseInt(val).toLocaleString() },
                },
                size: '78%',
              },
            },
          },
          grid: { padding: { top: -2 } },
          labels: ['Active', 'Offline', 'Expiring'],
          dataLabels: { enabled: false },
          legend: { position: 'bottom', fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, labels: { colors: '#475569' }, markers: { size: 5, offsetX: -2 }, itemMargin: { horizontal: 12, vertical: 4 } },
          tooltip: { style: { fontFamily: 'Manrope, sans-serif', fontSize: '12px' }, y: { formatter: (val: number) => { const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'; return `${val.toLocaleString()} (${pct}%)`; } } },
        });
        this.donutChart.render();
        this.renderAreaChart();
      },
      error: (err) => console.error('Failed to load device status', err)
    });
  }

  private renderAreaChart() {
    this.adminService.getGrowthData().subscribe({
      next: (data) => {
        const labels:    string[] = data['labels']    ?? [];
        const clients:   number[] = data['clients']   ?? [];
        const resellers: number[] = data['resellers'] ?? [];

        const el = document.getElementById('area-chart');
        if (!el) return;
        if (this.areaChart) this.areaChart.destroy();

        this.areaChart = new ApexCharts(el, {
          series: [{ name: 'Clients', data: clients }, { name: 'Resellers', data: resellers }],
          colors: ['#3B82F6', '#0D9488'],
          chart: { height: 260, width: '100%', type: 'area', fontFamily: 'Manrope, sans-serif', toolbar: { show: false }, zoom: { enabled: false } },
          fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02, stops: [0, 100] } },
          stroke: { width: 2.5, curve: 'smooth' },
          dataLabels: { enabled: false },
          xaxis: { categories: labels, labels: { style: { fontFamily: 'Manrope, sans-serif', fontSize: '11px', fontWeight: 600, colors: '#94a3b8' } }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { fontFamily: 'Manrope, sans-serif', fontSize: '11px', colors: '#94a3b8' } } },
          grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 4, xaxis: { lines: { show: false } } },
          legend: { position: 'bottom', fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, labels: { colors: '#475569' }, markers: { size: 5, offsetX: -2 }, itemMargin: { horizontal: 12, vertical: 4 } },
          tooltip: { style: { fontFamily: 'Manrope, sans-serif', fontSize: '12px' }, x: { show: true } },
          markers: { size: 4, strokeWidth: 2.5, strokeColors: '#ffffff', hover: { size: 7 } },
        });
        this.areaChart.render();
      },
      error: (err) => console.error('Failed to load growth data', err)
    });
  }

  readonly governorates = [
    'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
    'Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine',
    'Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse',
    'Tataouine','Tozeur','Tunis','Zaghouan'
  ];

  // ── Access Requests ───────────────────────────────────────
  private loadPendingRequests() {
    this.http.get<any[]>('http://localhost:8080/api/request-access/reseller/pending')
      .subscribe({
        next: (data) => this.pendingRequests.set(data.filter(r => r.status === 'PENDING')),
        error: () => {}
      });
  }

  regeneratePassword(req: any) {
    this.processingRequest.set(req.id);
    this.http.post(`http://localhost:8080/api/request-access/regenerate-password/${req.id}`, {})
      .subscribe({
        next: () => { this.processingRequest.set(null); this.loadPendingRequests(); },
        error: () => { this.processingRequest.set(null); }
      });
  }

  formatReqDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-TN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
}