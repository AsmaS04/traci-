import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';

interface SparkPoint { x: number; y: number; }
interface TopReseller { name: string; clients: number; devices: number; activeRate: number; }
interface RiskAlert   { level: 'critical' | 'warning' | 'info'; message: string; count: number; }

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class Dashboard {

  constructor(private router: Router, public i18n: TranslationService) {}

  // ── Core KPIs ────────────────────────────────────────
  totalResellers = 148;
  totalClients   = 3420;
  totalDevices   = 8750;
  activeDevices  = 6890;
  offlineDevices = 1860;

  newResellersMonth = 12;
  newClientsMonth   = 247;
  newDevicesMonth   = 430;

  prevResellers = 136;
  prevClients   = 3173;
  prevDevices   = 8320;

  systemUptime   = 99.8;
  avgDeviceUptime = 97.2;

  // ── System health ────────────────────────────────────
  systemHealth = {
    server:         'online'  as 'online' | 'degraded' | 'offline',
    api:            'online'  as 'online' | 'degraded' | 'offline',
    offlineDevices: 1860,
    criticalAlerts: 3,
    syncIssues:     12,
    expiringSoon:   5,
  };

  // ── Risk alerts ──────────────────────────────────────
  riskAlerts: RiskAlert[] = [
    { level: 'critical', message: 'adm_risk_offline_48h',  count: 12 },
    { level: 'warning',  message: 'adm_risk_inactive_res', count: 3  },
    { level: 'warning',  message: 'adm_risk_expiring',     count: 5  },
    { level: 'info',     message: 'adm_risk_sync',         count: 8  },
  ];

  // ── Top resellers ────────────────────────────────────
  topResellers: TopReseller[] = [
    { name: 'TechVision SARL', clients: 24,  devices: 138, activeRate: 92 },
    { name: 'NetPlus Tunis',   clients: 31,  devices: 210, activeRate: 88 },
    { name: 'DigiServ Pro',    clients: 19,  devices: 97,  activeRate: 95 },
    { name: 'AlphaTech DZ',    clients: 15,  devices: 74,  activeRate: 81 },
    { name: 'SmartLink SFX',   clients: 12,  devices: 58,  activeRate: 91 },
  ];

  // ── Recent activity ──────────────────────────────────
  recentActivity = [
    { icon: 'reseller', labelKey: 'act_reseller_reg', sub: 'TechVision SARL', time: '2',  unit: 'min_ago' },
    { icon: 'client',   labelKey: 'act_client_added', sub: 'Société Elyes',   time: '14', unit: 'min_ago' },
    { icon: 'device',   labelKey: 'act_device_off',   sub: 'Device #4821',    time: '32', unit: 'min_ago' },
    { icon: 'client',   labelKey: 'act_client_added', sub: 'Alpha Corp',      time: '1',  unit: 'hr_ago'  },
    { icon: 'reseller', labelKey: 'act_reseller_upd', sub: 'NetPlus Tunis',   time: '2',  unit: 'hr_ago'  },
    { icon: 'device',   labelKey: 'act_device_off',   sub: 'Device #3302',    time: '3',  unit: 'hr_ago'  },
  ];

  // ── Donut ────────────────────────────────────────────
  readonly circumference = 2 * Math.PI * 42;

  // ── Sparklines ───────────────────────────────────────
  private spark(base: number, variance: number, points = 14): SparkPoint[] {
    return Array.from({ length: points }, (_, i) => ({
      x: i,
      y: base + Math.round(Math.sin(i / 2.5) * variance + (Math.random() - 0.4) * variance * 0.5),
    }));
  }
  readonly sparkResellers = this.spark(140, 6);
  readonly sparkClients   = this.spark(3300, 80);
  readonly sparkDevices   = this.spark(8600, 100);

  buildPath(pts: SparkPoint[], W = 80, H = 28): string {
    const xs = pts.map(p => p.x); const ys = pts.map(p => p.y);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minY = Math.min(...ys); const maxY = Math.max(...ys);
    return pts.map((p, i) => {
      const x = ((p.x - minX) / (maxX - minX || 1)) * W;
      const y = H - ((p.y - minY) / (maxY - minY || 1)) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  // ── Derived ──────────────────────────────────────────
  get activePercent()    { return Math.round((this.activeDevices  / this.totalDevices)  * 100); }
  get activeOffset()     { return this.circumference * (1 - this.activeDevices / this.totalDevices); }
  get totalUsers()       { return this.totalClients + this.totalResellers; }
  get growthResellers()  { return Math.round(((this.totalResellers - this.prevResellers) / this.prevResellers) * 100); }
  get growthClients()    { return Math.round(((this.totalClients   - this.prevClients)   / this.prevClients)   * 100); }
  get growthDevices()    { return Math.round(((this.totalDevices   - this.prevDevices)   / this.prevDevices)   * 100); }

  healthColor(s: string) {
    if (s === 'online')   return 'health--green';
    if (s === 'degraded') return 'health--amber';
    return 'health--red';
  }
  riskClass(l: string) {
    if (l === 'critical') return 'risk--red';
    if (l === 'warning')  return 'risk--amber';
    return 'risk--blue';
  }
  actClass(icon: string) {
    if (icon === 'reseller') return 'act--purple';
    if (icon === 'client')   return 'act--teal';
    return 'act--red';
  }


  // ── Add Reseller modal ────────────────────────────────
  showAddReseller = false;
  resellerForm: any = {};

  // ── Validation ────────────────────────────────────────
  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim());
  }
  isValidPhone(p: string): boolean {
    return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, ''));
  }
  get resellerEmailError(): string {
    return (this.resellerForm.email ?? '') && !this.isValidEmail(this.resellerForm.email)
      ? 'msg_error_invalid_email' : '';
  }
  get resellerPhoneError(): string {
    return (this.resellerForm.phone ?? '') && !this.isValidPhone(this.resellerForm.phone)
      ? 'msg_error_invalid_phone' : '';
  }

  openAddReseller() {
    this.resellerForm = { name: '', company: '', email: '', phone: '', address: '', region: 'Tunis', serverType: 'traci' };
    this.showAddReseller = true;
  }
  closeAddReseller() { this.showAddReseller = false; }
  saveReseller() {
    if (!this.isValidEmail(this.resellerForm.email) || !this.isValidPhone(this.resellerForm.phone)) return;
    this.totalResellers++;
    this.newResellersMonth++;
    this.topResellers = [
      { name: this.resellerForm.company || this.resellerForm.name, clients: 0, devices: 0, activeRate: 100 },
      ...this.topResellers.slice(0, 4)
    ];
    this.showAddReseller = false;
  }

  // ── Device Distribution ───────────────────────────────
  deviceDistribution = [
    { region: 'Tunis',    devices: 2840, pct: 100, color: '#0D9488' },
    { region: 'Sfax',     devices: 1920, pct: 68,  color: '#3B82F6' },
    { region: 'Sousse',   devices: 1450, pct: 51,  color: '#9333ea' },
    { region: 'Bizerte',  devices:  820, pct: 29,  color: '#D97706' },
    { region: 'Nabeul',   devices:  710, pct: 25,  color: '#16A34A' },
    { region: 'Autres',   devices:  960, pct: 34,  color: '#9CA3AF' },
  ];

  // ── System Performance ────────────────────────────────
  systemPerf = [
    { labelKey: 'adm_perf_api',      value: '120 ms', pct: 24,   warn: false },
    { labelKey: 'adm_perf_load',     value: '43%',    pct: 43,   warn: false },
    { labelKey: 'adm_perf_db',       value: '2.3k/m', pct: 46,   warn: false },
    { labelKey: 'adm_perf_memory',   value: '67%',    pct: 67,   warn: true  },
    { labelKey: 'adm_perf_uptime',   value: '99.8%',  pct: null, warn: false },
  ];

  // ── Event Timeline ────────────────────────────────────
  eventTimeline = [
    { time: '10:32', type: 'reseller',   labelKey: 'act_reseller_reg', entity: 'TechVision SARL'  },
    { time: '10:40', type: 'client',     labelKey: 'act_client_added', entity: 'Société Elyes'    },
    { time: '11:05', type: 'device_on',  labelKey: 'adm_evt_assigned', entity: 'Device #4821'     },
    { time: '11:30', type: 'device_off', labelKey: 'act_device_off',   entity: 'Device #2190'     },
    { time: '12:15', type: 'client',     labelKey: 'act_client_added', entity: 'Alpha Corp'       },
    { time: '14:02', type: 'reseller',   labelKey: 'act_reseller_upd', entity: 'NetPlus Tunis'    },
  ];
  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  navigateTo(p: string) { this.router.navigate([p]); }
}