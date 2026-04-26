import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { AdminService } from '../../../service/Admin.service';
import { ResellerService } from '../../../service/Reseller.service';
import { Reseller } from '../../../models/reseller.model';
import ApexCharts from 'apexcharts';
import { NotificationWebsocketService, AppNotification } from '../../../service/notification-websocket.service';
import { Subscription } from 'rxjs';

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
  private areaChart: ApexCharts | null = null;
  private refreshInterval: any = null;
  private notifSub!: Subscription;

  constructor(
    private router: Router,
    public i18n: TranslationService,
    private adminService: AdminService,
    private resellerService: ResellerService,
    private notifWs: NotificationWebsocketService
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

  totalRevenueMonth   = 18450;
  totalRevenueAllTime = 142800;
  revenueGrowthPct    = '+12.4%';

  alertEntries: AlertEntry[]  = [];
  topResellers: TopReseller[] = [];
  systemEvents: SystemEvent[] = [];

  showAddReseller = false;
  resellerForm: any = {};

  ngOnInit() {
    this.loadAll();
    this.refreshInterval = setInterval(() => this.loadAll(), 30000);

    this.notifSub = this.notifWs.notification$.subscribe((n: AppNotification) => {
      const type = n.type as string;
      const now  = new Date();
      const t    = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      this.systemEvents.unshift({
        time:   t,
        type:   this.evtTypeMap(type),
        label:  (n as any).label  ?? type,
        detail: (n as any).detail ?? (n as any).message ?? '',
      });
      if (this.systemEvents.length > 50) this.systemEvents.pop();

      if (['NEW_CLIENT', 'NEW_RESELLER', 'DEVICE_ASSIGNED'].includes(type)) {
        this.loadDashboard();
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.donutChart) this.donutChart.destroy();
    if (this.areaChart)  this.areaChart.destroy();
    this.notifSub?.unsubscribe();
  }

  private loadAll() {
    this.loadDashboard();
    this.loadResellers();
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
      },
      error: (err) => console.error('Failed to load resellers', err)
    });
  }

  private evtTypeMap(type: string): 'reseller' | 'client' | 'device' | 'admin' {
    if (type.includes('RESELLER')) return 'reseller';
    if (type.includes('CLIENT'))   return 'client';
    if (type.includes('DEVICE'))   return 'device';
    return 'admin';
  }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  fmtCurrency(n: number) { return `${new Intl.NumberFormat('fr-FR').format(n)} TND`; }
  navigateTo(p: string) { this.router.navigate([p]); }
  evtClass(t: string) {
    return t === 'reseller' ? 'ev--teal' : t === 'client' ? 'ev--blue' : t === 'device' ? 'ev--amber' : 'ev--purple';
  }

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

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get resellerEmailError(): string { return (this.resellerForm.email ?? '') && !this.isValidEmail(this.resellerForm.email) ? 'msg_error_invalid_email' : ''; }
  get resellerPhoneError(): string { return (this.resellerForm.phone ?? '') && !this.isValidPhone(this.resellerForm.phone) ? 'msg_error_invalid_phone' : ''; }

  openAddReseller() { this.resellerForm = { username: '', nomEntreprise: '', email: '', phone: '' }; this.showAddReseller = true; }
  closeAddReseller() { this.showAddReseller = false; }

  saveReseller() {
    if (!this.isValidEmail(this.resellerForm.email) || !this.isValidPhone(this.resellerForm.phone)) return;
    this.resellerService.create({
      username:      this.resellerForm.username,
      nomEntreprise: this.resellerForm.nomEntreprise,
      email:         this.resellerForm.email,
      phone:         this.resellerForm.phone,
    }).subscribe({
      next: () => { this.loadAll(); this.showAddReseller = false; },
      error: (err) => console.error('Failed to create reseller', err)
    });
  }
}