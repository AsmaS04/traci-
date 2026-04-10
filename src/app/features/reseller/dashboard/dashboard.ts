import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/reseller.service';
import {
  ResellerDashboardActivity,
  ExpiringDevice,
  ResellerClient,
} from '../../../data/reseller-mock-data';
import { Reseller } from '../../../models/reseller.model';

// Sparkline point
interface SparkPoint { day: number; value: number; }

// Device stats interface (computed from real data)
interface DeviceStats {
  total: number;
  active: number;
  offline: number;
  unassigned: number;
  neverActivated: number;
  newClientsMonth: number;
  prevMonthClients: number;
}

@Component({
  selector: 'app-reseller-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export default class ResellerDashboardComponent implements OnInit {

  private resellerService = inject(ResellerService);
  private router = inject(Router);
  public i18n = inject(TranslationService);

  // ── Backend Data (signals) ────────────────────────────
  reseller = signal<Reseller | null>(null);
  clients = signal<ResellerClient[]>([]);
  loading = signal(true);

  // ── Mock data still used (until backend implements these) ──
  recentActivity: ResellerDashboardActivity[] = [];
  expiringDevices: ExpiringDevice[] = [];

  readonly circumference = 2 * Math.PI * 42;

  ngOnInit() {
    this.loadDashboard();
  }

  // ── Load Real Data from Backend ───────────────────────
  loadDashboard() {
    const resellerId = 27; // Using first reseller from database (bayremw)

    this.loading.set(true);

    // Load reseller info
    this.resellerService.getResellerById(resellerId).subscribe({
      next: (data) => {
        this.reseller.set(data);
        console.log('✅ Reseller loaded:', data);
      },
      error: (err) => console.error('❌ Failed to load reseller:', err)
    });

    // Load clients
    this.resellerService.getResellerClients(resellerId).subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loading.set(false);
        console.log('✅ Clients loaded:', data);
      },
      error: (err) => {
        console.error('❌ Failed to load clients:', err);
        this.loading.set(false);
      }
    });
  }

  // ── Computed Stats (from real data) ───────────────────
  get stats(): DeviceStats {
    const clientList = this.clients();
    const totalDevices = clientList.reduce((sum, c) => sum + (c.devices || 0), 0);
    const activeDevices = clientList.reduce((sum, c) => sum + (c.active || 0), 0);
    
    return {
      total: totalDevices,
      active: activeDevices,
      offline: totalDevices - activeDevices,
      unassigned: 0, // TODO: Implement when device assignment tracking is ready
      neverActivated: 0, // TODO: Implement
      newClientsMonth: clientList.filter(c => {
        const joinDate = new Date(c.joinDate);
        const now = new Date();
        return joinDate.getMonth() === now.getMonth() && 
               joinDate.getFullYear() === now.getFullYear();
      }).length,
      prevMonthClients: clientList.length
    };
  }

  // ── Top stats ─────────────────────────────────────────
  get totalClients()    { return this.reseller()?.totalClients || 0; }
  get newClientsMonth() { return this.stats.newClientsMonth; }
  get totalDevices()    { return this.stats.total; }
  get activeDevices()   { return this.stats.active; }
  get offlineDevices()  { return this.stats.offline; }
  get alertsCount()     { return this.expiringDevices.filter(d => d.daysLeft <= 7).length; }

  get activePercent()  { 
    return this.totalDevices > 0 
      ? Math.round((this.activeDevices / this.totalDevices) * 100) 
      : 0;
  }
  get growthPercent()  { 
    return this.stats.prevMonthClients > 0
      ? Math.round((this.stats.newClientsMonth / this.stats.prevMonthClients) * 100) 
      : 0;
  }
  get activeOffset()   { 
    return this.totalDevices > 0
      ? this.circumference * (1 - this.activeDevices / this.totalDevices)
      : this.circumference;
  }

  // ── Client health ─────────────────────────────────────
  get stableClients(): number {
    return this.clients().filter(c => c.status === 'active' && c.active === c.devices).length;
  }
  get issueClients(): number {
    return this.clients().filter(c => c.status === 'inactive' || c.active < c.devices).length;
  }
  get clientHealthPct(): number {
    const total = this.clients().length;
    return total > 0 ? Math.round((this.stableClients / total) * 100) : 0;
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
    const clientList = this.clients();
    if (clientList.length === 0) return '—';
    const top = [...clientList].sort((a, b) => b.active - a.active)[0];
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

  // ── Add Client modal ──────────────────────────────────
  showAddModal = false;
  addForm: any = {};

  // ── Validation ────────────────────────────────────────
  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim());
  }
  isValidPhone(p: string): boolean {
    return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, ''));
  }
  get addEmailError(): string {
    return (this.addForm.email ?? '') && !this.isValidEmail(this.addForm.email)
      ? 'msg_error_invalid_email' : '';
  }
  get addPhoneError(): string {
    return (this.addForm.phone ?? '') && !this.isValidPhone(this.addForm.phone)
      ? 'msg_error_invalid_phone' : '';
  }

  openAddClient() {
    this.addForm = {
      firstName: '', lastName: '', email: '', phone: '',
      region: '', deviceSource: 'own', simSource: 'reseller',
      serverType: 'traci', amountPaid: 0, status: 'active',
    };
    this.showAddModal = true;
  }

  saveNewClient() {
    if (!this.isValidEmail(this.addForm.email) || !this.isValidPhone(this.addForm.phone)) return;
    
    // TODO: Call backend API to create client
    // For now, just add to local array
    const newId = Math.max(...this.clients().map(c => c.id), 0) + 1;
    const newClient = {
      ...this.addForm,
      id: newId,
      devices: 0, active: 0,
      lastActivity: 'just now',
      joinDate: new Date().toISOString().slice(0, 10),
    };
    
    this.clients.set([...this.clients(), newClient]);
    this.showAddModal = false;
    
    console.log('✅ New client added (locally):', newClient);
    console.log('⚠️ TODO: Implement backend API call to save client');
  }

  closeAddModal() { this.showAddModal = false; }
}