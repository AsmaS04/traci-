import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { DeviceService } from '../../../service/Device.service';
import { AbonnementService } from '../../../service/Abonnement.service';
import { ToastService } from '../../../service/Toast.service';
import { DeviceRequestService } from '../../../service/DeviceRequest.service';
import { Device } from '../../../models/device.model';
import { Client } from '../../../models/client.model';
import { Reseller } from '../../../models/reseller.model';

@Component({
  selector: 'app-reseller-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.html',
  styleUrls: ['./devices.css'],
})
export default class ResellerDevicesComponent implements OnInit {

  readonly i18n                = inject(TranslationService);
  private resellerService      = inject(ResellerService);
  private clientService        = inject(ClientService);
  private deviceService        = inject(DeviceService);
  private aboService           = inject(AbonnementService);
  private toast                = inject(ToastService);
  private deviceRequestService = inject(DeviceRequestService);

  reseller:     Reseller | null = null;
  devices:      Device[]        = [];
  libreDevices: Device[]        = [];
  clients:      Client[]        = [];
  loading = true;

  ngOnInit() {
    this.resellerService.getMyProfile().subscribe({
      next: (r: Reseller) => {
        this.reseller = r;
        this.loadDevices(r.idRev);
        this.loadLibreDevices(r.idRev);
      },
      error: () => { this.loading = false; }
    });
    this.clientService.getMyClients().subscribe({
      next: (data: Client[]) => { this.clients = data; },
      error: () => {}
    });
  }

  private loadDevices(resellerId: number) {
    this.deviceService.getByReseller(resellerId).subscribe({
      next: (data: Device[]) => { this.devices = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  private loadLibreDevices(resellerId: number) {
    this.deviceService.getLibreByReseller(resellerId).subscribe({
      next: (data: Device[]) => { this.libreDevices = data; },
      error: () => {}
    });
  }

  // ── Search & filter ────────────────────────────────────
  search        = '';
  filterStatus: 'all' | 'actif' | 'expiré' | 'inactif' | 'libre' = 'all';
  filterModel   = 'all';

  get filtered(): Device[] {
    const q = this.search.toLowerCase().trim();
    return this.devices.filter(d => {
      const matchQ = !q ||
        String(d.numDevice ?? '').toLowerCase().includes(q) ||
        (d.imei ?? '').toLowerCase().includes(q) ||
        (d.model ?? '').toLowerCase().includes(q) ||
        (d.clientName ?? '').toLowerCase().includes(q);
      const matchStatus = this.filterStatus === 'all' || (d.status ?? '').toLowerCase() === this.filterStatus;
      const matchModel  = this.filterModel  === 'all' || d.model === this.filterModel;
      return matchQ && matchStatus && matchModel;
    });
  }

  get totalCount()    { return this.devices.length; }
  get activeCount()   { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'actif').length; }
  get expiredCount()  { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'expiré').length; }
  get inactiveCount() { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'inactif').length; }
  get libreCount()    { return this.libreDevices.length; }

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

  fmt(n: number): string { return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0); }
  clientFullName(c: Client): string { return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(); }

  // ── Detail panel ───────────────────────────────────────
  panelOpen   = false;
  panelDevice: Device | null = null;

  openPanel(d: Device) { this.panelDevice = d; this.panelOpen = true; }
  closePanel()         { this.panelOpen = false; }

  // ══════════════════════════════════════════════════════
  // HYBRID ASSIGN MODAL
  // ══════════════════════════════════════════════════════
  showAssignModal  = false;
  assignTab: 'pick' | 'count' = 'pick';

  selectedClientId: number | null = null;

  assignDuration = 1;
  assignPrice    = 0;

  selectedDeviceIds: Set<number> = new Set();

  assignCount    = 1;
  countPreview: Device[] = [];

  assignInProgress = false;
  assignDone       = 0;
  assignTotal      = 0;
  assignErrors     = 0;

  openAssignModal() {
    this.selectedClientId  = null;
    this.assignTab         = 'pick';
    this.assignDuration    = 1;
    this.assignPrice       = 0;
    this.selectedDeviceIds = new Set();
    this.assignCount       = 1;
    this.countPreview      = [];
    this.assignDone        = 0;
    this.assignTotal       = 0;
    this.assignErrors      = 0;
    this.assignInProgress  = false;
    this.showAssignModal   = true;
    this.updateCountPreview();
  }

  closeAssignModal() {
    if (this.assignInProgress) return;
    this.showAssignModal = false;
  }

  switchAssignTab(t: 'pick' | 'count') {
    this.assignTab = t;
    if (t === 'count') this.updateCountPreview();
  }

  toggleDevice(id: number) {
    if (this.selectedDeviceIds.has(id)) this.selectedDeviceIds.delete(id);
    else                                this.selectedDeviceIds.add(id);
  }

  isSelected(id: number) { return this.selectedDeviceIds.has(id); }

  toggleSelectAll() {
    if (this.selectedDeviceIds.size === this.libreDevices.length) {
      this.selectedDeviceIds = new Set();
    } else {
      this.selectedDeviceIds = new Set(this.libreDevices.map(d => d.idDevice));
    }
  }

  get allSelected()  { return this.libreDevices.length > 0 && this.selectedDeviceIds.size === this.libreDevices.length; }
  get someSelected() { return this.selectedDeviceIds.size > 0 && !this.allSelected; }

  updateCountPreview() {
    this.countPreview = this.libreDevices.slice(0, Math.max(0, this.assignCount));
  }

  get devicesToAssign(): Device[] {
    if (this.assignTab === 'pick') {
      return this.libreDevices.filter(d => this.selectedDeviceIds.has(d.idDevice));
    }
    return this.countPreview;
  }

  get canAssign(): boolean {
    return !this.assignInProgress &&
           !!this.selectedClientId &&
           !!this.reseller &&
           this.assignDuration >= 1 &&
           this.assignPrice >= 0 &&
           this.devicesToAssign.length > 0;
  }

  get assignProgress(): number {
    if (!this.assignTotal) return 0;
    return Math.round((this.assignDone / this.assignTotal) * 100);
  }

  async runBulkAssign() {
    if (!this.canAssign || !this.reseller || !this.selectedClientId) return;
    const devices = this.devicesToAssign;

    this.assignInProgress = true;
    this.assignTotal      = devices.length;
    this.assignDone       = 0;
    this.assignErrors     = 0;

    for (const device of devices) {
      try {
        await this.aboService.assignDevice(
          this.reseller.idRev,
          this.selectedClientId,
          device.idDevice,
          this.assignDuration,
          this.assignPrice
        ).toPromise();
        this.assignDone++;
      } catch {
        this.assignErrors++;
        this.assignDone++;
      }
    }

    this.assignInProgress = false;
    const ok   = this.assignDone - this.assignErrors;
    const fail = this.assignErrors;

    if (fail === 0)    this.toast.success(`${ok} device${ok > 1 ? 's' : ''} assigned successfully`);
    else if (ok === 0) this.toast.error(`All ${fail} assignments failed`);
    else               this.toast.warning(`${ok} assigned, ${fail} failed`);

    this.showAssignModal = false;
    this.loadDevices(this.reseller.idRev);
    this.loadLibreDevices(this.reseller.idRev);
  }

  // ══════════════════════════════════════════════════════
  // DEVICE REQUEST MODAL
  // ══════════════════════════════════════════════════════
  showRequestModal  = false;
  requestCount      = 1;
  requestMessage    = '';
  requestSubmitting = false;

  openRequestModal() {
    this.requestCount    = 1;
    this.requestMessage  = '';
    this.showRequestModal = true;
  }

  closeRequestModal() { this.showRequestModal = false; }

  submitDeviceRequest() {
    if (!this.reseller || this.requestCount < 1 || this.requestCount > 50) return;
    this.requestSubmitting = true;

      this.deviceRequestService.createRequest(
      this.reseller.idRev,
      this.requestCount,
      this.requestMessage
    ).subscribe({
      next: () => {
        this.requestSubmitting  = false;
        this.showRequestModal   = false;
        this.toast.success(`Request for ${this.requestCount} devices sent to admin`);
      },
      error: () => {
        this.requestSubmitting = false;
        this.toast.error('Failed to send request');
      }
    });
  }
}