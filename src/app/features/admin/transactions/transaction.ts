import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { MOCK_DEVICES, MOCK_DEVICE_TRANSACTIONS } from '../../../data/device-mock-data';
import { DeviceTransaction, ClientDevice } from '../../../models/device.model';

interface TransactionRow extends DeviceTransaction {
  clientName:   string;
  resellerName: string;
}

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction.html',
  styleUrls: ['./transaction.css'],
})
export class Transactions {

  constructor(public i18n: TranslationService) {}

  private readonly resellerNames: Record<number,string> = {
    1: 'TechVision SARL', 2: 'NetPlus Solutions', 3: 'ConnectPro Tunis',
  };
  private readonly clientNames: Record<number,string> = {
    1:'Elyes Mansouri', 2:'Sarra Ben Ali', 3:'Mohamed Chaabane',
    4:'Amira Trabelsi', 5:'Youssef Ferchichi', 6:'Mariem Belhaj',
  };

  readonly devices: ClientDevice[] = MOCK_DEVICES;

  readonly allRows: TransactionRow[] = MOCK_DEVICE_TRANSACTIONS.map(t => ({
    ...t,
    clientName:   this.clientNames[t.clientId]    ?? '—',
    resellerName: this.resellerNames[t.resellerId] ?? '—',
  }));

  // ── Filters ────────────────────────────────────────────
  search         = '';
  filterReseller = 'all';
  filterClient   = 'all';
  filterType     = 'all';
  filterDevice   = '';
  filterDateFrom = '';
  filterDateTo   = '';
  sortField: keyof TransactionRow = 'date';
  sortAsc = false;

  readonly resellerOptions = [
    { id:'all', name:'All Resellers' },
    { id:'1',   name:'TechVision SARL' },
    { id:'2',   name:'NetPlus Solutions' },
    { id:'3',   name:'ConnectPro Tunis' },
  ];
  readonly clientOptions = [
    { id:'all', name:'All Clients' },
    ...Object.entries(this.clientNames).map(([id, name]) => ({ id, name }))
  ];
  readonly typeOptions = ['all', 'device_sale', 'renewal'];

  get filtered(): TransactionRow[] {
    const q = this.search.toLowerCase().trim();
    return this.allRows.filter(t => {
      const matchQ        = !q || t.serial.toLowerCase().includes(q) || t.model.toLowerCase().includes(q) || t.clientName.toLowerCase().includes(q) || t.resellerName.toLowerCase().includes(q);
      const matchReseller = this.filterReseller === 'all' || String(t.resellerId) === this.filterReseller;
      const matchClient   = this.filterClient   === 'all' || String(t.clientId)   === this.filterClient;
      const matchType     = this.filterType     === 'all' || t.type              === this.filterType;
      const matchDevice   = !this.filterDevice  || t.serial.toLowerCase().includes(this.filterDevice.toLowerCase());
      const matchFrom     = !this.filterDateFrom || t.date >= this.filterDateFrom;
      const matchTo       = !this.filterDateTo   || t.date <= this.filterDateTo;
      return matchQ && matchReseller && matchClient && matchType && matchDevice && matchFrom && matchTo;
    }).sort((a, b) => {
      const av = a[this.sortField] ?? ''; const bv = b[this.sortField] ?? '';
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (this.sortAsc ? 1 : -1);
    });
  }

  clearFilters() {
    this.search = ''; this.filterReseller = 'all'; this.filterClient = 'all';
    this.filterType = 'all'; this.filterDevice = ''; this.filterDateFrom = ''; this.filterDateTo = '';
  }

  get hasActiveFilters(): boolean {
    return this.search !== '' || this.filterReseller !== 'all' || this.filterClient !== 'all' || this.filterType !== 'all' || this.filterDevice !== '' || this.filterDateFrom !== '' || this.filterDateTo !== '';
  }

  sortBy(f: keyof TransactionRow) {
    if (this.sortField === f) this.sortAsc = !this.sortAsc;
    else { this.sortField = f; this.sortAsc = false; }
  }
  sortIcon(f: keyof TransactionRow) {
    if (this.sortField !== f) return '↕';
    return this.sortAsc ? '↑' : '↓';
  }

  // ── KPIs ────────────────────────────────────────────────
  get totalRevenue()      { return this.allRows.reduce((s, t) => s + t.amount, 0); }
  get totalTransactions() { return this.allRows.length; }
  get avgTransactionVal() { return this.allRows.length ? Math.round(this.totalRevenue / this.allRows.length) : 0; }
  get totalRenewals()     { return this.allRows.filter(t => t.type === 'renewal').length; }

  get revenueByReseller(): { name: string; amount: number; pct: number }[] {
    const map: Record<string,number> = {};
    this.allRows.forEach(t => { map[t.resellerName] = (map[t.resellerName] ?? 0) + t.amount; });
    const total = this.totalRevenue || 1;
    return Object.entries(map).map(([name, amount]) => ({ name, amount, pct: Math.round((amount / total) * 100) })).sort((a, b) => b.amount - a.amount);
  }

  // ── Panel ────────────────────────────────────────────────
  panelOpen = false;
  panelTx: TransactionRow | null = null;
  openPanel(t: TransactionRow) { this.panelTx = t; this.panelOpen = true; }
  closePanel() { this.panelOpen = false; }
  get panelDevice(): ClientDevice | null { return this.devices.find(d => d.id === this.panelTx?.deviceId) ?? null; }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }

  modelColor(m: string): string {
    if (m === 'ACCENT BOX')  return 'model--box';
    if (m === 'ACCENT MINI') return 'model--mini';
    if (m === 'ACCENT PRO')  return 'model--pro';
    return 'model--lite';
  }

  typeClass(type: string): string {
    return type === 'renewal' ? 'type--renewal' : 'type--sale';
  }

  typeLabel(type: string): string {
    return type === 'renewal' ? this.i18n.t('res_type_renewal') : this.i18n.t('res_type_sale');
  }
}