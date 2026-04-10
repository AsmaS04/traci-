// src/app/features/client/devices/devices.ts

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientDevice } from '../../../models/deviceClient.model';
import { MOCK_DEVICES } from '../../../data/mock-devicesClient.data';
import { TranslationService } from '../../../service/translation.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devices.html',
  styleUrl: './devices.css'
})
export default class DevicesComponent implements OnInit {

  router = inject(Router);
  i18n = inject(TranslationService);  // ← ADDED

  // Signals
  devices = signal<ClientDevice[]>([]);
  filteredDevices = signal<ClientDevice[]>([]);
  selectedStatus = signal<'all' | 'active' | 'expired'>('all');
  searchTerm = signal('');

  // Stats
  get totalDevices() {
    return this.devices().length;
  }

  get activeDevices() {
    return this.devices().filter(d => d.status === 'active').length;
  }

  get expiredDevices() {
    return this.devices().filter(d => d.status === 'expired').length;
  }

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    // TODO: Replace with real API call
    const currentClientId = 1; // Ahmed's ID
    const clientDevices = MOCK_DEVICES.filter(d => d.clientId === currentClientId);
    this.devices.set(clientDevices);
    this.filteredDevices.set(clientDevices);
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

    // Filter by status
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(d => d.status === this.selectedStatus());
    }

    // Filter by search term
    if (this.searchTerm()) {
      filtered = filtered.filter(d =>
        d.model.toLowerCase().includes(this.searchTerm()) ||
        d.serialNumber.toLowerCase().includes(this.searchTerm())
      );
    }

    this.filteredDevices.set(filtered);
  }

  getDeviceIcon(model: string): string {
    if (model.includes('BOX')) return '📦';
    if (model.includes('MINI')) return '📱';
    if (model.includes('PRO')) return '💼';
    if (model.includes('LITE')) return '⚡';
    return '📡';
  }

  getStatusLabel(status: 'active' | 'expired'): string {
    return status === 'active' 
      ? this.i18n.t('dev_status_active') || 'Actif'
      : this.i18n.t('dev_status_expired') || 'Expiré';
  }

  getStatusColor(status: 'active' | 'expired'): string {
    return status === 'active'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';
  }

  navigateToDeviceDetails(deviceId: number) {
    this.router.navigate(['/client-dashboard/devices', deviceId]);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}