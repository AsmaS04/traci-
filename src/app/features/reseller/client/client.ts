import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import {
  MOCK_RESELLER_CLIENTS,
  MOCK_RESELLER,
  ResellerClient,
} from '../../../data/reseller-mock-data';
import {
  MOCK_DEVICES,
  MOCK_DEVICE_TRANSACTIONS,
} from '../../../data/device-mock-data';
import { ClientDevice, DeviceTransaction } from '../../../models/device.model';

@Component({
  selector: 'app-reseller-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client.html',
  styleUrls: ['./client.css'],
})
export default class ResellerClientsComponent {

  readonly i18n = inject(TranslationService);

  clients: ResellerClient[]          = [...MOCK_RESELLER_CLIENTS];
  reseller                           = MOCK_RESELLER;
  allDevices: ClientDevice[]         = [...MOCK_DEVICES];
  allTransactions: DeviceTransaction[] = [...MOCK_DEVICE_TRANSACTIONS];

  // ── Search & filter ───────────────────────────────────
  search = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  get filtered(): ResellerClient[] {
    return this.clients.filter(c => {
      const q = this.search.toLowerCase();
      const matchSearch = !q ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q);
      const matchStatus = this.filterStatus === 'all' || c.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  // ── Slide-over panel ──────────────────────────────────
  panelOpen   = false;
  panelClient: ResellerClient | null = null;
  panelTab: 'profile' | 'devices' | 'operations' = 'profile';

  openPanel(c: ResellerClient) {
    this.panelClient = c;
    this.panelTab    = 'profile';
    this.panelOpen   = true;
  }
  closePanel()                                               { this.panelOpen = false; }
  switchPanelTab(t: 'profile' | 'devices' | 'operations')   { this.panelTab = t; }

  get panelInactive(): number {
    return this.panelClient ? this.panelClient.devices - this.panelClient.active : 0;
  }

  // ── Device helpers ────────────────────────────────────
  devicesForClient(id: number): ClientDevice[] {
    return this.allDevices.filter(d => d.clientId === id);
  }
  transactionsForClient(id: number): DeviceTransaction[] {
    return this.allTransactions.filter(t => t.clientId === id);
  }
  totalPaidByClient(id: number): number {
    return this.transactionsForClient(id).reduce((s, t) => s + t.amount, 0);
  }
  deviceStatusClass(s: string): string {
    if (s === 'active')  return 'dev-badge--active';
    if (s === 'expired') return 'dev-badge--expired';
    return 'dev-badge--inactive';
  }
  daysUntilExpiry(date: string): number {
    return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  }
  expiryUrgency(date: string): string {
    const d = this.daysUntilExpiry(date);
    if (d < 0)   return 'expiry--expired';
    if (d <= 30) return 'expiry--soon';
    return '';
  }

  // ── Add Device modal ──────────────────────────────────
  showDeviceModal = false;
  deviceForm: any = {};
  readonly deviceModels = ['ACCENT BOX', 'ACCENT MINI', 'ACCENT PRO', 'ACCENT LITE'];
  readonly simProviders  = ['none', 'Ooredoo', 'Tunisie Telecom', 'Orange'];

  openAddDevice() {
    const today = new Date().toISOString().slice(0, 10);
    const next  = new Date(); next.setFullYear(next.getFullYear() + 1);
    this.deviceForm = {
      serialNumber: '', model: 'ACCENT BOX',
      activationDate: today, expirationDate: next.toISOString().slice(0, 10),
      price: 450, hasSim: false,
      simNumber: '', simProvider: 'none', simOwnedBy: 'none', notes: '',
    };
    this.showDeviceModal = true;
  }

  saveDevice() {
    if (!this.deviceForm.serialNumber?.trim()) return;
    const newDevId = Math.max(...this.allDevices.map(d => d.id), 0) + 1;
    const dev: ClientDevice = {
      id: newDevId,
      clientId:       this.panelClient!.id,
      resellerId:     this.reseller.id,
      serialNumber:   this.deviceForm.serialNumber,
      model:          this.deviceForm.model,
      activationDate: this.deviceForm.activationDate,
      expirationDate: this.deviceForm.expirationDate,
      price:          Number(this.deviceForm.price) || 0,
      status:         'active',
      hasSim:         this.deviceForm.hasSim,
      simNumber:      this.deviceForm.hasSim ? this.deviceForm.simNumber : null,
      simProvider:    this.deviceForm.hasSim ? this.deviceForm.simProvider : 'none',
      simOwnedBy:     this.deviceForm.hasSim ? this.deviceForm.simOwnedBy : 'none',
    };
    this.allDevices.push(dev);

    // Auto-create DeviceTransaction
    const newTxId = Math.max(...this.allTransactions.map(t => t.id), 0) + 1;
    this.allTransactions.push({
      id: newTxId, deviceId: dev.id,
      clientId: dev.clientId, resellerId: dev.resellerId,
      serial: dev.serialNumber, model: dev.model,
      type: 'device_sale' as const,
      amount: dev.price, date: dev.activationDate,
      notes: this.deviceForm.notes,
    });

    // Update client counters
    const idx = this.clients.findIndex(c => c.id === this.panelClient!.id);
    if (idx > -1) {
      this.clients[idx].devices++;
      this.clients[idx].active++;
      this.panelClient = { ...this.clients[idx] };
    }
    this.showDeviceModal = false;
  }

  closeDeviceModal() { this.showDeviceModal = false; }

  // ── Add / Edit client modal ───────────────────────────
  showModal  = false;
  showDelete = false;
  isEdit     = false;
  selected: ResellerClient | null = null;
  form: Partial<ResellerClient>   = {};

  openAdd() {
    this.isEdit = false;
    this.form = {
      firstName: '', lastName: '', email: '', phone: '',
      region: '', deviceSource: 'own', simSource: 'reseller',
      serverType: 'traci', amountPaid: 0, status: 'active',
    };
    this.showModal = true;
  }

  openEdit(c: ResellerClient) {
    this.isEdit = true; this.selected = c;
    this.form = { ...c };
    this.showModal = true; this.closePanel();
  }

  openDelete(c: ResellerClient) {
    this.selected = c; this.showDelete = true; this.closePanel();
  }

  isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string) { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get formEmailError() { return (this.form.email ?? '') && !this.isValidEmail(this.form.email ?? '') ? 'msg_error_invalid_email' : ''; }
  get formPhoneError() { return (this.form.phone ?? '') && !this.isValidPhone(this.form.phone ?? '') ? 'msg_error_invalid_phone' : ''; }

  saveClient() {
    if (!this.isValidEmail(this.form.email ?? '') || !this.isValidPhone(this.form.phone ?? '')) return;
    if (this.isEdit && this.selected) {
      const idx = this.clients.findIndex(c => c.id === this.selected!.id);
      if (idx > -1) this.clients[idx] = { ...this.selected, ...this.form } as ResellerClient;
    } else {
      const newId = Math.max(...this.clients.map(c => c.id), 0) + 1;
      this.clients.push({ ...this.form, id: newId, devices: 0, active: 0, lastActivity: 'just now', joinDate: new Date().toISOString().slice(0, 10) } as ResellerClient);
    }
    this.showModal = false;
  }

  confirmDelete() {
    if (this.selected) this.clients = this.clients.filter(c => c.id !== this.selected!.id);
    this.showDelete = false; this.selected = null;
  }

  closeModal()  { this.showModal  = false; }
  closeDelete() { this.showDelete = false; }
  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  get totalCount()    { return this.clients.length; }
  get activeCount()   { return this.clients.filter(c => c.status === 'active').length; }
  get inactiveCount() { return this.clients.filter(c => c.status === 'inactive').length; }
  initials(c: ResellerClient) { return (c.firstName[0] + c.lastName[0]).toUpperCase(); }
}