import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import {
  MOCK_RESELLER,
  MOCK_RESELLER_DEVICE_STATS,
  MOCK_RESELLER_CLIENTS,
  MOCK_RESELLER_DASHBOARD_ACTIVITY,
  MOCK_EXPIRING_DEVICES,
  ResellerDashboardActivity,
  ExpiringDevice,
  ResellerClient,
} from '../../../data/reseller-mock-data';

// Sparkline point
interface SparkPoint { day: number; value: number; }

@Component({
  selector: 'app-reseller-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule],
})
export default class ResellerDashboardComponent {

  readonly reseller       = MOCK_RESELLER;
  readonly stats          = MOCK_RESELLER_DEVICE_STATS;
  readonly clients        = MOCK_RESELLER_CLIENTS;
  recentActivity: ResellerDashboardActivity[] = MOCK_RESELLER_DASHBOARD_ACTIVITY;
  expiringDevices: ExpiringDevice[]           = MOCK_EXPIRING_DEVICES;

  readonly circumference = 2 * Math.PI * 42;

  constructor(private router: Router, public i18n: TranslationService) {}

  // ── Top stats ─────────────────────────────────────────
  get totalClients()    { return this.reseller.totalClients; }
  get newClientsMonth() { return this.stats.newClientsMonth; }
  get totalDevices()    { return this.stats.total; }
  get activeDevices()   { return this.stats.active; }
  get offlineDevices()  { return this.stats.offline; }
  get alertsCount()     { return this.expiringDevices.filter(d => d.daysLeft <= 7).length; }

  get activePercent()  { return Math.round((this.activeDevices / this.totalDevices) * 100); }
  get growthPercent()  { return Math.round((this.stats.newClientsMonth / this.stats.prevMonthClients) * 100); }
  get activeOffset()   { return this.circumference * (1 - this.activeDevices / this.totalDevices); }

  // ── Client health ─────────────────────────────────────
  get stableClients(): number {
    return this.clients.filter(c => c.status === 'active' && c.active === c.devices).length;
  }
  get issueClients(): number {
    return this.clients.filter(c => c.status === 'inactive' || c.active < c.devices).length;
  }
  get clientHealthPct(): number {
    return Math.round((this.stableClients / this.clients.length) * 100);
  }
  get clientHealthOffset(): number {
    const r = 28; const circ = 2 * Math.PI * r;
    return circ * (1 - this.clientHealthPct / 100);
  }
  readonly healthCircumference = 2 * Math.PI * 28;

  // ── Sparkline (30 days of simulated device activity) ──
  readonly sparkData: SparkPoint[] = Array.from({ length: 30 }, (_, i) => ({
    day: i,
    value: 110 + Math.round(Math.sin(i / 4) * 8 + Math.random() * 6),
  }));

  get sparkPath(): string {
    const W = 260, H = 60;
    const vals = this.sparkData.map(p => p.value);
    const min = Math.min(...vals) - 2;
    const max = Math.max(...vals) + 2;
    const pts = this.sparkData.map((p, i) => {
      const x = (i / (this.sparkData.length - 1)) * W;
      const y = H - ((p.value - min) / (max - min)) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return pts.join(' ');
  }

  get sparkFillPath(): string {
    const W = 260, H = 60;
    const vals = this.sparkData.map(p => p.value);
    const min = Math.min(...vals) - 2;
    const max = Math.max(...vals) + 2;
    const pts = this.sparkData.map((p, i) => {
      const x = (i / (this.sparkData.length - 1)) * W;
      const y = H - ((p.value - min) / (max - min)) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M0,${H} L${pts.join(' L')} L${W},${H} Z`;
  }

  get avgUptime(): number { return 97; }
  get syncIssues(): number { return 2; }
  get mostActiveClient(): string {
    const top = [...this.clients].sort((a, b) => b.active - a.active)[0];
    return top ? `${top.firstName} ${top.lastName}` : '—';
  }

  // ── Helpers ───────────────────────────────────────────
  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  urgencyClass(days: number) {
    if (days <= 7)  return 'expiry--urgent';
    if (days <= 14) return 'expiry--warn';
    return 'expiry--ok';
  }
  activityClass(icon: string) {
    if (icon === 'client')             return 'act-icon--green';
    if (icon === 'device_assigned')    return 'act-icon--blue';
    if (icon === 'device_deactivated') return 'act-icon--red';
    return '';
  }
  navigateTo(path: string) { this.router.navigate([path]); }
}