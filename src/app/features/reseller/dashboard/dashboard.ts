import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { Reseller } from '../../../models/reseller.model';
import { Client } from '../../../models/client.model';

interface SparkPoint { day: number; value: number; }

@Component({
  selector: 'app-reseller-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export default class ResellerDashboardComponent implements OnInit {

  private resellerService = inject(ResellerService);
  private clientService = inject(ClientService);
  private router = inject(Router);
  public i18n = inject(TranslationService);

  reseller = signal<Reseller | null>(null);
  clients = signal<Client[]>([]);
  loading = signal(true);

  readonly circumference = 2 * Math.PI * 42;

  // Mock data still used (no backend for these yet)
  recentActivity: any[] = [];
  expiringDevices: any[] = [];

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);

    this.resellerService.getMyProfile().subscribe({
      next: (data: Reseller) => {
        this.reseller.set(data);
      },
      error: (err: any) => console.error('Failed to load reseller:', err)
    });

    this.clientService.getMyClients().subscribe({
      next: (data: Client[]) => {
        this.clients.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load clients:', err);
        this.loading.set(false);
      }
    });
  }

  // ── Computed ──────────────────────────────────────────
  get totalClients()    { return this.reseller()?.clientCount || this.clients().length; }
  get newClientsMonth() { return 0; } // TODO: backend doesn't track this
  get totalDevices()    { return 0; } // TODO: need device aggregation endpoint
  get activeDevices()   { return 0; }
  get offlineDevices()  { return 0; }
  get alertsCount()     { return 0; }

  get activePercent()  { return this.totalDevices > 0 ? Math.round((this.activeDevices / this.totalDevices) * 100) : 0; }
  get growthPercent()  { return 0; }
  get activeOffset()   { return this.totalDevices > 0 ? this.circumference * (1 - this.activeDevices / this.totalDevices) : this.circumference; }

  get stableClients(): number { return this.clients().filter(c => (c.graceDaysLeft ?? 0) > 0).length; }
  get issueClients(): number  { return this.clients().filter(c => (c.graceDaysLeft ?? 0) <= 0).length; }
  get clientHealthPct(): number {
    const total = this.clients().length;
    return total > 0 ? Math.round((this.stableClients / total) * 100) : 0;
  }
  get clientHealthOffset(): number {
    const circ = 2 * Math.PI * 28;
    return circ * (1 - this.clientHealthPct / 100);
  }
  readonly healthCircumference = 2 * Math.PI * 28;

  // ── Sparkline ─────────────────────────────────────────
  readonly sparkData: SparkPoint[] = Array.from({ length: 30 }, (_, i) => ({
    day: i,
    value: 110 + Math.round(Math.sin(i / 4) * 8 + Math.random() * 6),
  }));

  get sparkPath(): string {
    const W = 260, H = 60;
    const vals = this.sparkData.map(p => p.value);
    const min = Math.min(...vals) - 2;
    const max = Math.max(...vals) + 2;
    return this.sparkData.map((p, i) => {
      const x = (i / (this.sparkData.length - 1)) * W;
      const y = H - ((p.value - min) / (max - min)) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
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
    const list = this.clients();
    if (!list.length) return '—';
    return `${list[0].firstName ?? ''} ${list[0].lastName ?? ''}`.trim() || '—';
  }

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

  // ── Add Client modal ──────────────────────────────────
  showAddModal = false;
  addForm: any = {};

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get addEmailError(): string { return (this.addForm.email ?? '') && !this.isValidEmail(this.addForm.email) ? 'msg_error_invalid_email' : ''; }
  get addPhoneError(): string { return (this.addForm.phone ?? '') && !this.isValidPhone(this.addForm.phone) ? 'msg_error_invalid_phone' : ''; }

  openAddClient() {
    this.addForm = { firstName: '', lastName: '', email: '', phone: '' };
    this.showAddModal = true;
  }

  saveNewClient() {
    if (!this.isValidEmail(this.addForm.email) || !this.isValidPhone(this.addForm.phone)) return;
    // TODO: call backend
    this.showAddModal = false;
  }

  closeAddModal() { this.showAddModal = false; }
}