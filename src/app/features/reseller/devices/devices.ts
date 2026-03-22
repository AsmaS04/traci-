import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { MOCK_RESELLER_CLIENTS } from '../../../data/reseller-mock-data';
import { MOCK_DEVICES, MOCK_DEVICE_TRANSACTIONS } from '../../../data/device-mock-data';
import { ClientDevice, DeviceTransaction } from '../../../models/device.model';

@Component({
  selector: 'app-reseller-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.html',
  styleUrls: ['./devices.css'],
})
export default class ResellerDevicesComponent {

  readonly i18n    = inject(TranslationService);
  readonly clients = MOCK_RESELLER_CLIENTS;

  devices: ClientDevice[]            = [...MOCK_DEVICES];
  transactions: DeviceTransaction[]  = [...MOCK_DEVICE_TRANSACTIONS];

  // ── Status auto-update ────────────────────────────────
  computeStatus(expirationDate: string): 'active' | 'expired' {
    return new Date(expirationDate) > new Date() ? 'active' : 'expired';
  }

  // ── Search & filter ───────────────────────────────────
  search       = '';
  filterStatus: 'all' | 'active' | 'expired' | 'inactive' = 'all';
  filterModel  = 'all';

  get filtered(): ClientDevice[] {
    const q = this.search.toLowerCase().trim();
    return this.devices.map(d => ({
      ...d, status: this.computeStatus(d.expirationDate) as any
    })).filter(d => {
      const client = this.clientName(d.clientId);
      const matchQ = !q || d.serialNumber.toLowerCase().includes(q) || d.model.toLowerCase().includes(q) || client.toLowerCase().includes(q) || (d.simNumber ?? '').toLowerCase().includes(q);
      const matchStatus = this.filterStatus === 'all' || d.status === this.filterStatus;
      const matchModel  = this.filterModel  === 'all' || d.model  === this.filterModel;
      return matchQ && matchStatus && matchModel;
    });
  }

  // ── Stats / KPIs ──────────────────────────────────────
  get totalCount()    { return this.devices.length; }
  get activeCount()   { return this.devices.filter(d => this.computeStatus(d.expirationDate) === 'active').length; }
  get expiredCount()  { return this.devices.filter(d => this.computeStatus(d.expirationDate) === 'expired').length; }
  get inactiveCount() { return this.devices.filter(d => d.status === 'inactive').length; }
  get expiringSoon()  {
    return this.devices.filter(d => {
      const days = this.daysUntilExpiry(d.expirationDate);
      return this.computeStatus(d.expirationDate) === 'active' && days >= 0 && days <= 30;
    }).length;
  }

  // ── Model options for filter dropdown ─────────────────
  get modelOptions(): string[] {
    const models = ['all', ...new Set(this.devices.map(d => d.model))];
    return models;
  }

  // ── Helper methods ────────────────────────────────────
  modelColor(model: string): string {
    if (model.includes('BOX')) return 'model--box';
    if (model.includes('MINI')) return 'model--mini';
    if (model.includes('PRO')) return 'model--pro';
    if (model.includes('LITE')) return 'model--lite';
    return 'model--box';
  }

  statusClass(status: string): string {
    if (status === 'active')  return 'status--active';
    if (status === 'expired') return 'status--expired';
    return 'status--inactive';
  }

  expiryUrgency(dateStr: string): string {
    const days = this.daysUntilExpiry(dateStr);
    if (days < 0)   return 'expiry--expired';
    if (days <= 7)  return 'expiry--urgent';
    if (days <= 30) return 'expiry--warn';
    return '';
  }

  daysUntilExpiry(dateStr: string): number {
    const expiry = new Date(dateStr);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  typeLabel(type: string): string {
    return type === 'device_sale' ? this.i18n.t('res_type_sale') : this.i18n.t('res_type_renewal');
  }

  typeClass(type: string): string {
    return type === 'device_sale' ? 'type--sale' : 'type--renewal';
  }

  clientName(clientId: number): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : '—';
  }

  fmt(num: number): string {
    return num.toLocaleString('en-US');
  }

  // ── Detail panel ──────────────────────────────────────
  panelOpen   = false;
  panelDevice: ClientDevice | null = null;

  openPanel(d: ClientDevice) {
    this.panelDevice = { ...d, status: this.computeStatus(d.expirationDate) as any };
    this.panelOpen   = true;
    this.renewalForm = { amount: 80, notes: '' };
    this.showRenewalForm = false;
  }
  closePanel() { this.panelOpen = false; }

  get panelTransactions(): DeviceTransaction[] {
    return this.transactions.filter(t => t.deviceId === this.panelDevice?.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // ── Add Operation / Renewal ───────────────────────────
  showRenewalForm = false;
  renewalForm: { amount: number; notes: string } = { amount: 80, notes: '' };

  openRenewal() { this.showRenewalForm = true; }
  cancelRenewal() { this.showRenewalForm = false; }

  saveRenewal() {
    if (!this.panelDevice) return;

    // 1. Extend expiration by 1 year
    const devIdx = this.devices.findIndex(d => d.id === this.panelDevice!.id);
    if (devIdx > -1) {
      const old = new Date(this.devices[devIdx].expirationDate);
      old.setFullYear(old.getFullYear() + 1);
      const newExpiry = old.toISOString().slice(0, 10);
      this.devices[devIdx] = {
        ...this.devices[devIdx],
        expirationDate: newExpiry,
        status: 'active',
      };
      this.panelDevice = { ...this.devices[devIdx] };
    }

    // 2. Create renewal transaction
    const newId = Math.max(...this.transactions.map(t => t.id), 0) + 1;
    this.transactions.push({
      id:         newId,
      deviceId:   this.panelDevice.id,
      clientId:   this.panelDevice.clientId,
      resellerId: this.panelDevice.resellerId,
      serial:     this.panelDevice.serialNumber,
      model:      this.panelDevice.model,
      type:       'renewal',
      amount:     Number(this.renewalForm.amount),
      date:       new Date().toISOString().slice(0, 10),
      notes:      this.renewalForm.notes,
    });

    this.showRenewalForm = false;
  }

  // ── Add Device modal ──────────────────────────────────
  showModal  = false;
  deviceForm: any = {};
  readonly deviceModels = ['ACCENT BOX', 'ACCENT MINI', 'ACCENT PRO', 'ACCENT LITE'];
  readonly simProviders  = ['none', 'Ooredoo', 'Tunisie Telecom', 'Orange'];

  openAdd() {
    const today = new Date().toISOString().slice(0, 10);
    const next  = new Date(); next.setFullYear(next.getFullYear() + 1);
    this.deviceForm = {
      clientId: this.clients[0]?.id,
      serialNumber: '', model: 'ACCENT BOX',
      activationDate: today, expirationDate: next.toISOString().slice(0, 10),
      price: 450, hasSim: false,
      simNumber: '', simProvider: 'none', simOwnedBy: 'none', notes: '',
    };
    this.showModal = true;
  }

  saveDevice() {
    if (!this.deviceForm.serialNumber?.trim()) return;
    const newId = Math.max(...this.devices.map(d => d.id), 0) + 1;
    const dev: ClientDevice = {
      id: newId,
      clientId:       Number(this.deviceForm.clientId),
      resellerId:     1,
      serialNumber:   this.deviceForm.serialNumber,
      model:          this.deviceForm.model,
      activationDate: this.deviceForm.activationDate,
      expirationDate: this.deviceForm.expirationDate,
      price:          Number(this.deviceForm.price) || 0,
      status:         this.computeStatus(this.deviceForm.expirationDate) as any,
      hasSim:         this.deviceForm.hasSim,
      simNumber:      this.deviceForm.hasSim ? this.deviceForm.simNumber : null,
      simProvider:    this.deviceForm.hasSim ? this.deviceForm.simProvider : 'none',
      simOwnedBy:     this.deviceForm.hasSim ? this.deviceForm.simOwnedBy : 'none',
    };
    this.devices.push(dev);

    // Auto-create device_sale transaction
    const txId = Math.max(...this.transactions.map(t => t.id), 0) + 1;
    this.transactions.push({
      id:         txId,
      deviceId:   dev.id,
      clientId:   dev.clientId,
      resellerId: 1,
      serial:     dev.serialNumber,
      model:      dev.model,
      type:       'device_sale',
      amount:     dev.price,
      date:       dev.activationDate,
      notes:      this.deviceForm.notes,
    });
    this.showModal = false;
  }

  closeModal() { this.showModal = false; }
}