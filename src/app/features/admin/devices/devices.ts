import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { MOCK_DEVICES } from '../../../data/device-mock-data';
import { ClientDevice } from '../../../models/device.model';

interface DeviceRow extends ClientDevice {
  clientName:   string;
  resellerName: string;
}

@Component({
  selector: 'app-admin-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.html',
  styleUrls: ['./devices.css'],
})
export class AdminDevices {

  constructor(public i18n: TranslationService) {}

  private readonly clientNames: Record<number, string> = {
    1: 'Elyes Mansouri',
    2: 'Sarra Ben Ali',
    3: 'Mohamed Chaabane',
    4: 'Amira Trabelsi',
    5: 'Youssef Ferchichi',
    6: 'Mariem Belhaj',
  };

  private readonly resellerNames: Record<number, string> = {
    1: 'TechVision SARL',
    2: 'NetPlus Solutions',
    3: 'ConnectPro Tunis',
  };

  readonly allRows: DeviceRow[] = MOCK_DEVICES.map(d => ({
    ...d,
    clientName:   this.clientNames[d.clientId]    ?? '—',
    resellerName: this.resellerNames[d.resellerId] ?? '—',
  }));

  // ── Filters ───────────────────────────────────────────
  search         = '';
  filterStatus: 'all' | 'active' | 'expired' | 'inactive' = 'all';
  filterModel    = 'all';
  filterReseller = 'all';

  readonly modelOptions = ['all', 'ACCENT BOX', 'ACCENT MINI', 'ACCENT PRO', 'ACCENT LITE'];
  readonly resellerOptions = [
    { id: 'all', name: 'All Resellers' },
    { id: '1',   name: 'TechVision SARL' },
    { id: '2',   name: 'NetPlus Solutions' },
    { id: '3',   name: 'ConnectPro Tunis' },
  ];

  get filtered(): DeviceRow[] {
    const q = this.search.toLowerCase().trim();
    return this.allRows.filter(d => {
      const matchQ = !q ||
        d.serialNumber.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.resellerName.toLowerCase().includes(q) ||
        (d.simNumber ?? '').toLowerCase().includes(q);
      const matchStatus   = this.filterStatus   === 'all' || d.status === this.filterStatus;
      const matchModel    = this.filterModel    === 'all' || d.model  === this.filterModel;
      const matchReseller = this.filterReseller === 'all' || String(d.resellerId) === this.filterReseller;
      return matchQ && matchStatus && matchModel && matchReseller;
    });
  }

  // ── KPI counts ────────────────────────────────────────
  get totalCount()   { return this.allRows.length; }
  get activeCount()  { return this.allRows.filter(d => d.status === 'active').length; }
  get expiredCount() { return this.allRows.filter(d => d.status === 'expired').length; }
  get inactiveCount(){ return this.allRows.filter(d => d.status === 'inactive').length; }
  get expiringSoon() {
    return this.allRows.filter(d => {
      const days = this.daysUntilExpiry(d.expirationDate);
      return d.status === 'active' && days >= 0 && days <= 30;
    }).length;
  }

  // ── Helpers ───────────────────────────────────────────
  daysUntilExpiry(date: string): number {
    return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  }

  statusClass(s: string): string {
    if (s === 'active')  return 'status--active';
    if (s === 'expired') return 'status--expired';
    return 'status--inactive';
  }

  expiryUrgency(date: string): string {
    const d = this.daysUntilExpiry(date);
    if (d < 0)   return 'expiry--expired';
    if (d <= 30) return 'expiry--soon';
    return '';
  }

  modelColor(m: string): string {
    if (m === 'ACCENT BOX')  return 'model--box';
    if (m === 'ACCENT MINI') return 'model--mini';
    if (m === 'ACCENT PRO')  return 'model--pro';
    return 'model--lite';
  }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }

  // ── Detail panel ──────────────────────────────────────
  panelOpen   = false;
  panelDevice: DeviceRow | null = null;

  openPanel(d: DeviceRow) { this.panelDevice = d; this.panelOpen = true; }
  closePanel()            { this.panelOpen = false; }
}