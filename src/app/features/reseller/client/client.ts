import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import {
  MOCK_RESELLER_CLIENTS,
  MOCK_RESELLER,
  ResellerClient,
} from '../../../data/reseller-mock-data';

@Component({
  selector: 'app-reseller-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client.html',
  styleUrls: ['./client.css'],
})
export default class ResellerClientsComponent {

  readonly i18n = inject(TranslationService);

  clients: ResellerClient[] = [...MOCK_RESELLER_CLIENTS];
  reseller = MOCK_RESELLER;

  // ── Search & filter ──────────────────────────────────
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

  // ── Slide-over panel ─────────────────────────────────
  panelOpen   = false;
  panelClient: ResellerClient | null = null;

  openPanel(c: ResellerClient) {
    this.panelClient = c;
    this.panelOpen   = true;
  }
  closePanel() { this.panelOpen = false; }

  get panelInactive(): number {
    return this.panelClient ? this.panelClient.devices - this.panelClient.active : 0;
  }
  get panelActiveRate(): number {
    if (!this.panelClient?.devices) return 0;
    return Math.round((this.panelClient.active / this.panelClient.devices) * 100);
  }

  // ── Add / Edit modal ─────────────────────────────────
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
    this.isEdit    = true;
    this.selected  = c;
    this.form      = { ...c };
    this.showModal = true;
    this.closePanel();
  }

  openDelete(c: ResellerClient) {
    this.selected   = c;
    this.showDelete = true;
    this.closePanel();
  }

  saveClient() {
    if (this.isEdit && this.selected) {
      const idx = this.clients.findIndex(c => c.id === this.selected!.id);
      if (idx > -1) this.clients[idx] = { ...this.selected, ...this.form } as ResellerClient;
    } else {
      const newId = Math.max(...this.clients.map(c => c.id), 0) + 1;
      this.clients.push({
        ...this.form,
        id: newId,
        devices: 0, active: 0,
        lastActivity: 'just now',
        joinDate: new Date().toISOString().slice(0, 10),
      } as ResellerClient);
    }
    this.showModal = false;
  }

  confirmDelete() {
    if (this.selected)
      this.clients = this.clients.filter(c => c.id !== this.selected!.id);
    this.showDelete = false;
    this.selected   = null;
  }

  closeModal()  { this.showModal  = false; }
  closeDelete() { this.showDelete = false; }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }

  get totalCount()    { return this.clients.length; }
  get activeCount()   { return this.clients.filter(c => c.status === 'active').length; }
  get inactiveCount() { return this.clients.filter(c => c.status === 'inactive').length; }

  initials(c: ResellerClient) {
    return (c.firstName[0] + c.lastName[0]).toUpperCase();
  }
}