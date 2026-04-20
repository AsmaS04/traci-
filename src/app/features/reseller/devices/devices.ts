import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { Device } from '../../../models/device.model';

@Component({
  selector: 'app-reseller-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.html',
  styleUrls: ['./devices.css'],
})
export default class ResellerDevicesComponent implements OnInit {

  readonly i18n = inject(TranslationService);
  private resellerService = inject(ResellerService);

  devices: Device[] = [];
  loading = true;

  ngOnInit() {
    this.resellerService.getMyDevices().subscribe({
      next: (data: Device[]) => { this.devices = data; this.loading = false; },
      error: (err: any) => { console.error('Failed to load devices', err); this.loading = false; }
    });
  }

  // ── Search & filter ───────────────────────────────────
  search       = '';
  filterStatus: 'all' | 'active' | 'expired' | 'inactive' = 'all';
  filterModel  = 'all';

  get filtered(): Device[] {
    const q = this.search.toLowerCase().trim();
    return this.devices.filter(d => {
      const matchQ = !q ||
        (d.numDevice ?? '').toLowerCase().includes(q) ||
        (d.imei ?? '').toLowerCase().includes(q) ||
        (d.model ?? '').toLowerCase().includes(q) ||
        (d.clientName ?? '').toLowerCase().includes(q);
      const matchStatus = this.filterStatus === 'all' || (d.status ?? '').toLowerCase() === this.filterStatus;
      const matchModel  = this.filterModel  === 'all' || d.model === this.filterModel;
      return matchQ && matchStatus && matchModel;
    });
  }

  get totalCount()    { return this.devices.length; }
  get activeCount()   { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'active').length; }
  get expiredCount()  { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'expired').length; }
  get inactiveCount() { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'inactive').length; }
  get expiringSoon()  { return 0; } // No expiration date in backend

  get modelOptions(): string[] {
    const models = new Set<string>();
    this.devices.forEach(d => { if (d.model) models.add(d.model); });
    return ['all', ...Array.from(models)];
  }

  modelColor(model: string): string {
    const m = (model ?? '').toLowerCase();
    if (m.includes('box'))  return 'model--box';
    if (m.includes('mini')) return 'model--mini';
    if (m.includes('pro'))  return 'model--pro';
    if (m.includes('lite')) return 'model--lite';
    return 'model--box';
  }

  statusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'active')  return 'status--active';
    if (s === 'expired') return 'status--expired';
    return 'status--inactive';
  }

  // Stubs for HTML compatibility
  expiryUrgency(_date: string): string { return ''; }
  daysUntilExpiry(_date: string): number { return 0; }
  typeLabel(type: string): string { return type; }
  typeClass(type: string): string { return type === 'device_sale' ? 'type--sale' : 'type--renewal'; }
  clientName(_id: number): string { return '—'; }
  fmt(n: number): string { return new Intl.NumberFormat().format(n); }

  // ── Detail panel ──────────────────────────────────────
  panelOpen   = false;
  panelDevice: Device | null = null;

  openPanel(d: Device) { this.panelDevice = d; this.panelOpen = true; }
  closePanel() { this.panelOpen = false; }

  get panelTransactions(): any[] { return []; }

  // Stubs for renewal/add device (wired later)
  showRenewalForm = false;
  renewalForm = { amount: 80, notes: '' };
  openRenewal() { this.showRenewalForm = true; }
  cancelRenewal() { this.showRenewalForm = false; }
  saveRenewal() { this.showRenewalForm = false; }

  showModal = false;
  deviceForm: any = {};
  readonly deviceModels = ['ACCENT BOX', 'ACCENT MINI', 'ACCENT PRO', 'ACCENT LITE'];
  readonly simProviders = ['none', 'Ooredoo', 'Tunisie Telecom', 'Orange'];
  openAdd() { this.showModal = true; }
  saveDevice() { this.showModal = false; }
  closeModal() { this.showModal = false; }
}