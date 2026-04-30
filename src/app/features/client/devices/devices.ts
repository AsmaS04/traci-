import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../models/device.model';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { ToastService } from '../../../service/Toast.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.html',
  styleUrl: './devices.css'
})
export default class DevicesComponent implements OnInit {

  i18n          = inject(TranslationService);
  private clientService = inject(ClientService);
  private toast         = inject(ToastService);

  devices        = signal<Device[]>([]);
  loading        = signal(true);
  filterStatus   = signal<'all' | 'actif' | 'expiré' | 'inactif'>('all');
  search         = signal('');
  panelOpen      = signal(false);
  panelDevice    = signal<Device | null>(null);

  filteredDevices = computed(() => {
    const q   = this.search().toLowerCase().trim();
    const f   = this.filterStatus();
    return this.devices().filter(d => {
      const matchSearch = !q ||
        (d.model ?? '').toLowerCase().includes(q) ||
        (d.numDevice ?? '').toLowerCase().includes(q) ||
        (d.imei ?? '').toLowerCase().includes(q);
      const matchStatus = f === 'all' || (d.status ?? '').toLowerCase() === f;
      return matchSearch && matchStatus;
    });
  });

  get totalDevices()    { return this.devices().length; }
  get activeDevices()   { return this.devices().filter(d => (d.status ?? '').toLowerCase() === 'actif').length; }
  get expiredDevices()  { return this.devices().filter(d => (d.status ?? '').toLowerCase() === 'expiré').length; }
  get inactiveDevices() { return this.devices().filter(d => (d.status ?? '').toLowerCase() === 'inactif').length; }

  ngOnInit() {
    this.loading.set(true);
    this.clientService.getMyDevices().subscribe({
      next: (data: Device[]) => { this.devices.set(data); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load devices.'); this.loading.set(false); }
    });
  }

  openPanel(d: Device)  { this.panelDevice.set(d); this.panelOpen.set(true); }
  closePanel()          { this.panelOpen.set(false); setTimeout(() => this.panelDevice.set(null), 300); }

  statusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')  return 'pill--actif';
    if (s === 'expiré') return 'pill--expired';
    return 'pill--inactive';
  }

  getDeviceIcon(model: string): string {
    const m = (model ?? '').toUpperCase();
    if (m.includes('BOX'))  return '📦';
    if (m.includes('MINI')) return '📱';
    if (m.includes('PRO'))  return '💼';
    if (m.includes('LITE')) return '⚡';
    return '📡';
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}