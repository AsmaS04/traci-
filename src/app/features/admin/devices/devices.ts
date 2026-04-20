import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../models/device.model';
import { TranslationService } from '../../../service/translation.service';
import { DeviceService } from '../../../service/Device.service';

@Component({
  selector: 'app-admin-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.html',
  styleUrl: './devices.css',
})
export class AdminDevices implements OnInit {

  constructor(
    public i18n: TranslationService,
    private deviceService: DeviceService
  ) {}

  devices: Device[] = [];
  loading = true;

  search = '';
  filterStatus: 'all' | 'active' | 'expired' | 'inactive' = 'all';
  filterModel = 'all';

  panelOpen = false;
  panelDevice: Device | null = null;

  ngOnInit() {
    this.loadDevices();
  }

  private loadDevices() {
    this.loading = true;
    this.deviceService.getAll().subscribe({
      next: (data) => {
        this.devices = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load devices', err);
        this.loading = false;
      }
    });
  }

  fmt(n: number | null | undefined) {
    if (n == null) return '—';
    return new Intl.NumberFormat().format(n);
  }

  get modelOptions(): string[] {
    const models = new Set<string>();
    this.devices.forEach(d => { if (d.model) models.add(d.model); });
    return ['all', ...Array.from(models)];
  }

  get filtered(): Device[] {
    const q = this.search.toLowerCase().trim();
    return this.devices.filter(d => {
      const matchQ = !q ||
        (d.numDevice ?? '').toLowerCase().includes(q) ||
        (d.imei ?? '').toLowerCase().includes(q) ||
        (d.model ?? '').toLowerCase().includes(q) ||
        (d.clientName ?? '').toLowerCase().includes(q) ||
        String(d.idDevice).includes(q);
      const matchStatus = this.filterStatus === 'all' || (d.status ?? '').toLowerCase() === this.filterStatus;
      const matchModel = this.filterModel === 'all' || d.model === this.filterModel;
      return matchQ && matchStatus && matchModel;
    });
  }

  get totalCount()    { return this.devices.length; }
  get activeCount()   { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'active').length; }
  get expiredCount()  { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'expired').length; }
  get inactiveCount() { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'inactive').length; }

  statusClass(status: string | null | undefined): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'active')   return 'status-pill--active';
    if (s === 'expired')  return 'status-pill--expired';
    return 'status-pill--inactive';
  }

  modelColor(model: string | null | undefined): string {
    const m = (model ?? '').toLowerCase();
    if (m.includes('pro'))  return 'model-badge--purple';
    if (m.includes('box'))  return 'model-badge--blue';
    if (m.includes('mini')) return 'model-badge--teal';
    if (m.includes('lite')) return 'model-badge--amber';
    return '';
  }

  openPanel(d: Device) {
    this.panelDevice = d;
    this.panelOpen = true;
  }

  closePanel() {
    this.panelOpen = false;
    setTimeout(() => { this.panelDevice = null; }, 300);
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' });
  }
}