import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Device } from '../../../models/device.model';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devices.html',
  styleUrl: './devices.css'
})
export default class DevicesComponent implements OnInit {

  router = inject(Router);
  i18n = inject(TranslationService);
  private clientService = inject(ClientService);

  devices = signal<Device[]>([]);
  filteredDevices = signal<Device[]>([]);
  selectedStatus = signal<'all' | 'active' | 'expired'>('all');
  searchTerm = signal('');

  get totalDevices()  { return this.devices().length; }
  get activeDevices() { return this.devices().filter(d => (d.status ?? '').toLowerCase() === 'active').length; }
  get expiredDevices(){ return this.devices().filter(d => (d.status ?? '').toLowerCase() === 'expired').length; }

  ngOnInit() { this.loadDevices(); }

  loadDevices() {
    this.clientService.getMyDevices().subscribe({
      next: (data: Device[]) => {
        this.devices.set(data);
        this.filteredDevices.set(data);
      },
      error: (err: any) => console.error('Failed to load devices', err)
    });
  }

  filterByStatus(status: 'all' | 'active' | 'expired') {
    this.selectedStatus.set(status);
    this.applyFilters();
  }

  searchDevices(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm.set(term);
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.devices();
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(d => (d.status ?? '').toLowerCase() === this.selectedStatus());
    }
    if (this.searchTerm()) {
      filtered = filtered.filter(d =>
        (d.model ?? '').toLowerCase().includes(this.searchTerm()) ||
        (d.numDevice ?? '').toLowerCase().includes(this.searchTerm()) ||
        (d.imei ?? '').toLowerCase().includes(this.searchTerm())
      );
    }
    this.filteredDevices.set(filtered);
  }

  getDeviceIcon(model: string): string {
    if ((model ?? '').includes('BOX')) return '📦';
    if ((model ?? '').includes('MINI')) return '📱';
    if ((model ?? '').includes('PRO')) return '💼';
    if ((model ?? '').includes('LITE')) return '⚡';
    return '📡';
  }

  getStatusLabel(status: string): string {
    const s = (status ?? '').toLowerCase();
    return s === 'active'
      ? this.i18n.t('dev_status_active') || 'Actif'
      : this.i18n.t('dev_status_expired') || 'Expiré';
  }

  navigateToDeviceDetails(deviceId: number) {
    this.router.navigate(['/client-dashboard/devices', deviceId]);
  }

  navigateTo(path: string) { this.router.navigate([path]); }
}