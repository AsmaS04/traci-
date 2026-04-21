
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { AdminService } from '../../../service/Admin.service';
import { ResellerService } from '../../../service/Reseller.service';
import { Reseller } from '../../../models/reseller.model';
import ApexCharts from 'apexcharts';
// add to imports at top:
import { NotificationWebsocketService, AppNotification } from '../../../service/notification-websocket.service';
import { Subscription } from 'rxjs';


interface ResellerHealth {
  name: string;
  clients: number;
  status: 'healthy' | 'low' | 'problem';
  lastActivity: string;
}

interface EmergencyItem {
  level: 'critical' | 'warning';
  label: string;
  count: number;
  route: string;
}

interface ActivityItem {
  type: 'reseller' | 'client' | 'device';
  label: string;
  detail: string;
  time: string;
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

  totalResellers = 0;
  inactiveResellers = 0;
  totalClients = 0;
  criticalIssues = 0;
  loading = true;

  devActive = 0;
  devOffline = 0;
  devExpiring = 0;
  devTotal = 0;

  emergencyItems: EmergencyItem[] = [];
  resellerHealth: ResellerHealth[] = [];

  newResellersMonth = 0;
  newClientsMonth = 0;
  bestReseller = '—';
  bestResellerGrowth = '';

  smartInsights: string[] = [];

  recentActivity: ActivityItem[] = [
    { type: 'reseller', label: 'New reseller registered',  detail: 'TechVision SARL', time: '2min' },
    { type: 'client',   label: 'New client added',         detail: 'Société Elyes — by Reseller Khalil', time: '14min' },
    { type: 'device',   label: 'Device went offline',      detail: 'Device #4821 — Client Ahmed', time: '32min' },
    { type: 'client',   label: 'New client added',         detail: 'Alpha Corp — by Reseller Nour', time: '1h' },
    { type: 'reseller', label: 'Reseller updated profile', detail: 'NetPlus Tunis', time: '2h' },
  ];

  showAddReseller = false;
  resellerForm: any = {};

  ngOnInit() {
  this.loadAll();
  this.refreshInterval = setInterval(() => this.loadAll(), 30000);

  this.notifSub = this.notifWs.notification$.subscribe((n: AppNotification) => {
    this.loadDashboard();
    if (n.type === 'NEW_CLIENT') {
      this.recentActivity.unshift({ type: 'client', label: 'New client added', detail: n.message, time: 'just now' });
    } else if (n.type === 'NEW_PAYMENT') {
      this.recentActivity.unshift({ type: 'reseller', label: 'Payment received', detail: n.message, time: 'just now' });
    }
    if (this.recentActivity.length > 10) this.recentActivity.pop();
  });
}

  ngOnDestroy() {
  if (this.refreshInterval) clearInterval(this.refreshInterval);
  if (this.donutChart) this.donutChart.destroy();
  if (this.areaChart) this.areaChart.destroy();
  this.notifSub?.unsubscribe();
}

  private loadAll() {
    this.loadDashboard();
    this.loadResellers();
  }

  private loadDashboard() {
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.totalResellers = stats['totalResellers'] ?? 0;
        this.totalClients = stats['totalClients'] ?? 0;
        this.devTotal = stats['totalDevices'] ?? 0;
        this.devActive = stats['activeDevices'] ?? 0;
        this.devOffline = stats['offlineDevices'] ?? 0;
        this.devExpiring = stats['expiringDevices'] ?? 0;
        this.inactiveResellers = stats['inactiveResellers'] ?? 0;

        this.emergencyItems = [];
        if (this.devOffline > 0) {
          this.emergencyItems.push({ level: 'critical', label: 'Devices offline', count: this.devOffline, route: '/admin/devices' });
        }
        if (this.devExpiring > 0) {
          this.emergencyItems.push({ level: 'warning', label: 'Subscriptions expiring soon', count: this.devExpiring, route: '/admin/devices' });
        }

        this.criticalIssues = this.devOffline;
        this.loading = false;

        this.renderDonutChart();
      },
      error: () => { this.loading = false; }
    });
  }

  private loadResellers() {
    this.resellerService.getAll().subscribe({
      next: (resellers: Reseller[]) => {
        this.resellerHealth = resellers.map(r => {
          const clients = r.clientCount ?? 0;
          let status: 'healthy' | 'low' | 'problem' = 'healthy';
          if (clients === 0) status = 'problem';
          return {
            name: r.nomEntreprise || r.username || '—',
            clients,
            status,
            lastActivity: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'
          };
        });
        this.resellerHealth.sort((a, b) => b.clients - a.clients);

        this.inactiveResellers = this.resellerHealth.filter(r => r.status === 'problem').length;
        if (this.inactiveResellers > 0 && !this.emergencyItems.find(e => e.label.includes('Resellers'))) {
          this.emergencyItems.push({ level: 'warning', label: 'Resellers inactive (0 clients)', count: this.inactiveResellers, route: '/admin/resellers' });
        }

        this.bestReseller = this.resellerHealth[0]?.name ?? '—';
        this.bestResellerGrowth = (this.resellerHealth[0]?.clients ?? 0) > 0 ? `${this.resellerHealth[0].clients} clients` : '';
        this.newResellersMonth = Math.min(resellers.length, 12);
        this.newClientsMonth = this.totalClients > 0 ? Math.min(this.totalClients, 47) : 0;

        this.smartInsights = [];
        if (this.inactiveResellers > 0) this.smartInsights.push(`${this.inactiveResellers} reseller(s) have 0 clients — need attention`);
        if (this.devOffline > 0) this.smartInsights.push(`${this.devOffline} device(s) currently offline`);
        if (this.newClientsMonth === 0) this.smartInsights.push(`No new clients this month`);
      },
      error: (err) => console.error('Failed to load resellers', err)
    });
  }

  // ── ApexCharts ────────────────────────────────────────

  private renderDonutChart() {
    this.adminService.getDeviceStatus().subscribe({
      next: (data) => {
        const active = data['active'] ?? 0;
        const offline = data['offline'] ?? 0;
        const expiring = data['expiring'] ?? 0;
        const total = active + offline + expiring;

        const el = document.getElementById('donut-chart');
        if (!el) return;
        if (this.donutChart) this.donutChart.destroy();

        this.donutChart = new ApexCharts(el, {
          series: [active, offline, expiring],
          colors: ['#0D9488', '#DC2626', '#F59E0B'],
          chart: {
            height: 280,
            width: '100%',
            type: 'donut',
            fontFamily: 'Manrope, sans-serif',
          },
          stroke: { colors: ['transparent'] },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name: {
                    show: true,
                    offsetY: 20,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#94a3b8',
                  },
                  total: {
                    showAlways: true,
                    show: true,
                    label: 'Total Devices',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#94a3b8',
                    formatter: () => total.toLocaleString(),
                  },
                  value: {
                    show: true,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#0f172a',
                    offsetY: -20,
                    formatter: (val: string) => parseInt(val).toLocaleString(),
                  },
                },
                size: '78%',
              },
            },
          },
          grid: { padding: { top: -2 } },
          labels: ['Active', 'Offline', 'Expiring'],
          dataLabels: { enabled: false },
          legend: {
            position: 'bottom',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            labels: { colors: '#475569' },
            markers: { size: 5, offsetX: -2 },
            itemMargin: { horizontal: 12, vertical: 4 },
          },
          tooltip: {
            style: { fontFamily: 'Manrope, sans-serif', fontSize: '12px' },
            y: {
              formatter: (val: number) => {
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return `${val.toLocaleString()} (${pct}%)`;
              }
            }
          },
        });
        this.donutChart.render();

        // Render growth chart after donut
        this.renderAreaChart();
      },
      error: (err) => console.error('Failed to load device status', err)
    });
  }

  private renderAreaChart() {
    this.adminService.getGrowthData().subscribe({
      next: (data) => {
        const labels: string[] = data['labels'] ?? [];
        const clients: number[] = data['clients'] ?? [];
        const resellers: number[] = data['resellers'] ?? [];

        const el = document.getElementById('area-chart');
        if (!el) return;
        if (this.areaChart) this.areaChart.destroy();

        this.areaChart = new ApexCharts(el, {
          series: [
            { name: 'Clients', data: clients },
            { name: 'Resellers', data: resellers },
          ],
          colors: ['#3B82F6', '#0D9488'],
          chart: {
            height: 260,
            width: '100%',
            type: 'area',
            fontFamily: 'Manrope, sans-serif',
            toolbar: { show: false },
            zoom: { enabled: false },
          },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.25,
              opacityTo: 0.02,
              stops: [0, 100],
            },
          },
          stroke: {
            width: 2.5,
            curve: 'smooth',
          },
          dataLabels: { enabled: false },
          xaxis: {
            categories: labels,
            labels: {
              style: {
                fontFamily: 'Manrope, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                colors: '#94a3b8',
              },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          yaxis: {
            labels: {
              style: {
                fontFamily: 'Manrope, sans-serif',
                fontSize: '11px',
                colors: '#94a3b8',
              },
            },
          },
          grid: {
            borderColor: 'rgba(0,0,0,0.05)',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
          },
          legend: {
            position: 'bottom',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            labels: { colors: '#475569' },
            markers: { size: 5, offsetX: -2 },
            itemMargin: { horizontal: 12, vertical: 4 },
          },
          tooltip: {
            style: { fontFamily: 'Manrope, sans-serif', fontSize: '12px' },
            x: { show: true },
          },
          markers: {
            size: 4,
            strokeWidth: 2.5,
            strokeColors: '#ffffff',
            hover: { size: 7 },
          },
        });
        this.areaChart.render();
      },
      error: (err) => console.error('Failed to load growth data', err)
    });
  }

  // ── Helpers ───────────────────────────────────────────
  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  navigateTo(p: string) { this.router.navigate([p]); }
  statusClass(s: string) { return s === 'healthy' ? 'st--healthy' : s === 'low' ? 'st--low' : 'st--problem'; }
  statusLabel(s: string) { return s === 'healthy' ? 'Healthy' : s === 'low' ? 'Low Activity' : 'Problem'; }
  actClass(t: string) { return t === 'reseller' ? 'at--teal' : t === 'client' ? 'at--blue' : 'at--red'; }

  // ── Modal ─────────────────────────────────────────────
  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get resellerEmailError(): string { return (this.resellerForm.email ?? '') && !this.isValidEmail(this.resellerForm.email) ? 'msg_error_invalid_email' : ''; }
  get resellerPhoneError(): string { return (this.resellerForm.phone ?? '') && !this.isValidPhone(this.resellerForm.phone) ? 'msg_error_invalid_phone' : ''; }

  openAddReseller() { this.resellerForm = { username: '', nomEntreprise: '', email: '', phone: '' }; this.showAddReseller = true; }
  closeAddReseller() { this.showAddReseller = false; }
  saveReseller() {
  console.log('saveReseller called');
  console.log('email valid:', this.isValidEmail(this.resellerForm.email));
  console.log('phone valid:', this.isValidPhone(this.resellerForm.phone));
  console.log('form:', this.resellerForm);

  if (!this.isValidEmail(this.resellerForm.email) || !this.isValidPhone(this.resellerForm.phone)) return;

  this.resellerService.create({
    username: this.resellerForm.username,
    nomEntreprise: this.resellerForm.nomEntreprise,
    email: this.resellerForm.email,
    phone: this.resellerForm.phone
  }).subscribe({
    next: () => { this.loadAll(); this.showAddReseller = false; },
    error: (err) => console.error('Failed to create reseller', err)
  });
}
}