import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  i18n                  = inject(TranslationService);
  private clientService = inject(ClientService);
  private toast         = inject(ToastService);
  private http          = inject(HttpClient);

  devices       = signal<Device[]>([]);
  loading       = signal(true);
  filterStatus  = signal<'all' | 'actif' | 'inactif'>('all');
  search        = signal('');
  panelOpen     = signal(false);
  panelDevice   = signal<Device | null>(null);

  // Rename state
  editingName   = signal(false);
  editNameValue = signal('');
  renameLoading = signal(false);

  filteredDevices = computed(() => {
    const q = this.search().toLowerCase().trim();
    const f = this.filterStatus();
    return this.devices().filter(d => {
      const matchSearch = !q ||
        (d.model       ?? '').toLowerCase().includes(q) ||
        (d.numDevice   ?? '').toLowerCase().includes(q) ||
        (d.imei        ?? '').toLowerCase().includes(q) ||
        (d.customName  ?? '').toLowerCase().includes(q);
      const matchStatus = f === 'all' || (d.status ?? '').toLowerCase() === f;
      return matchSearch && matchStatus;
    });
  });

  get totalDevices()    { return this.devices().length; }
  get activeDevices()   { return this.devices().filter(d => (d.status ?? '').toLowerCase() === 'actif').length; }
  get inactiveDevices() { return this.devices().filter(d => (d.status ?? '').toLowerCase() === 'inactif').length; }

  ngOnInit() {
    this.loading.set(true);
    this.clientService.getMyDevices().subscribe({
      next: (data: Device[]) => { this.devices.set(data); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load devices.'); this.loading.set(false); }
    });
  }

  openPanel(d: Device) {
    this.panelDevice.set(d);
    this.panelOpen.set(true);
    this.editingName.set(false);
    this.editNameValue.set('');
  }

  closePanel() {
    this.panelOpen.set(false);
    this.editingName.set(false);
    setTimeout(() => this.panelDevice.set(null), 300);
  }

  startRename() {
    this.editNameValue.set(this.panelDevice()?.customName ?? '');
    this.editingName.set(true);
  }

  cancelRename() {
    this.editingName.set(false);
    this.editNameValue.set('');
  }

  saveDeviceName() {
    const d = this.panelDevice();
    if (!d || this.renameLoading()) return;

    this.renameLoading.set(true);
    this.http.patch<Device>(`http://localhost:8080/api/devices/${d.idDevice}/name`, {
      customName: this.editNameValue().trim() || null
    }).subscribe({
      next: (updated) => {
        const newName = updated.customName ?? undefined;
        this.devices.update(list =>
          list.map(dev => dev.idDevice === d.idDevice ? { ...dev, customName: newName } : dev)
        );
        this.panelDevice.set({ ...d, customName: newName });
        this.editingName.set(false);
        this.renameLoading.set(false);
        this.toast.success('Device name updated.');
      },
      error: () => {
        this.toast.error('Failed to update device name.');
        this.renameLoading.set(false);
      }
    });
  }

  getDisplayName(d: Device): string {
    return d.customName || d.model || '—';
  }

  statusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')  return 'pill--actif';
    return 'pill--inactive';
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}