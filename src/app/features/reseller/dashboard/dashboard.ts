import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { Reseller } from '../../../models/reseller.model';
import { Client } from '../../../models/client.model';
import ApexCharts from 'apexcharts';

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
  private router          = inject(Router);
  public  i18n            = inject(TranslationService);

  reseller = signal<Reseller | null>(null);
  clients  = signal<Client[]>([]);
  loading  = signal(true);

  readonly circumference = 2 * Math.PI * 42;
  private clientChart: ApexCharts | null = null;
  private emailCheckTimeout: any = null;

  ngOnInit() { this.loadDashboard(); }

  ngOnDestroy() {
    if (this.clientChart) this.clientChart.destroy();
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
  }

  loadDashboard() {
    this.loading.set(true);

    this.resellerService.getMyProfile().subscribe({
      next: (data: Reseller) => { this.reseller.set(data); },
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

  // ── Computed ──────────────────────────────────────────────
  get totalClients()   { return this.reseller()?.clientCount || this.clients().length; }
  get totalDevices()   { return 0; }
  get activeDevices()  { return 0; }
  get offlineDevices() { return 0; }
  get alertsCount()    { return this.offlineDevices; }
  get activePercent()  { return this.totalDevices > 0 ? Math.round((this.activeDevices / this.totalDevices) * 100) : 0; }
  get activeOffset()   { return this.totalDevices > 0 ? this.circumference * (1 - this.activeDevices / this.totalDevices) : this.circumference; }

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

  // ── Helpers ───────────────────────────────────────────────
  initials(c: Client): string {
    return ((c.firstName ?? '?')[0] + (c.lastName ?? '?')[0]).toUpperCase();
  }

  fullName(c: Client): string {
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  }

  isActive(c: Client): boolean {
    return (c.graceDaysLeft ?? 0) > 0;
  }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  navigateTo(path: string) { this.router.navigate([path]); }

  // ── ApexChart ─────────────────────────────────────────────
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

  // ── Add Client modal ──────────────────────────────────────
  showAddModal     = false;
  addForm: any     = {};
  addEmailExists   = false;

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }

  get addEmailError(): string {
    const email = this.addForm.email ?? '';
    if (!email) return '';
    if (!this.isValidEmail(email)) return 'msg_error_invalid_email';
    if (this.addEmailExists) return 'msg_error_email_taken';
    return '';
  }

  get addPhoneError(): string {
    return (this.addForm.phone ?? '') && !this.isValidPhone(this.addForm.phone) ? 'msg_error_invalid_phone' : '';
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
    if (
      !this.isValidEmail(this.addForm.email) ||
      !this.isValidPhone(this.addForm.phone) ||
      this.addEmailExists
    ) return;

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
    this.showAddModal  = false;
    this.addEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
  }
}