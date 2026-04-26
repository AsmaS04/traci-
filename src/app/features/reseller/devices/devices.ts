import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { DeviceService } from '../../../service/Device.service';
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

  readonly i18n           = inject(TranslationService);
  private resellerService = inject(ResellerService);
  private clientService   = inject(ClientService);
  private deviceService   = inject(DeviceService);

  reseller:     Reseller | null = null;
  devices:      Device[]        = [];
  libreDevices: Device[]        = [];
  clients:      Client[]        = [];
  loading = true;

  ngOnInit() {
    // Load reseller profile first to get ID, then load scoped devices
    this.resellerService.getMyProfile().subscribe({
      next: (r: Reseller) => {
        this.reseller = r;
        this.loadDevices(r.idRev);
        this.loadLibreDevices(r.idRev);
      },
      error: (err: any) => { console.error('Failed to load reseller profile', err); this.loading = false; }
    });

    this.clientService.getMyClients().subscribe({
      next: (data: Client[]) => { this.clients = data; },
      error: (err: any) => console.error('Failed to load clients', err)
    });
  }

  private loadDevices(resellerId: number) {
    this.deviceService.getByReseller(resellerId).subscribe({
      next: (data: Device[]) => { this.devices = data; this.loading = false; },
      error: (err: any) => { console.error('Failed to load devices', err); this.loading = false; }
    });
  }

  private loadLibreDevices(resellerId: number) {
    this.deviceService.getLibreByReseller(resellerId).subscribe({
      next: (data: Device[]) => { this.libreDevices = data; },
      error: (err: any) => console.error('Failed to load libre devices', err)
    });
  }

  // ── Search & filter ───────────────────────────────────
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

  statusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')   return 'status--active';
    if (s === 'expiré')  return 'status--expired';
    if (s === 'libre')   return 'status--libre';
    return 'status--inactive';
  }

  fmt(n: number): string { return new Intl.NumberFormat().format(n); }

  clientFullName(c: Client): string {
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  }

  // ── Detail panel ──────────────────────────────────────
  panelOpen    = false;
  panelDevice: Device | null = null;

  openPanel(d: Device) { this.panelDevice = d; this.panelOpen = true; }
  closePanel() { this.panelOpen = false; }

  // ── Assign Device modal ───────────────────────────────
  showAssignModal = false;
  assignSaving    = false;
  assignError     = '';

  assignForm: {
    clientId:     number | null;
    deviceId:     number | null;
    dureeMois:    number;
    prixUnitaire: number;
  } = { clientId: null, deviceId: null, dureeMois: 1, prixUnitaire: 0 };

  get selectedLibreDevice(): Device | null {
    if (!this.assignForm.deviceId) return null;
    return this.libreDevices.find(d => d.idDevice === this.assignForm.deviceId) ?? null;
  }

  openAssignModal() {
    this.assignForm  = { clientId: null, deviceId: null, dureeMois: 1, prixUnitaire: 0 };
    this.assignError = '';
    this.showAssignModal = true;
  }

  closeAssignModal() {
    if (this.assignSaving) return;
    this.showAssignModal = false;
  }

  get canSaveAssign(): boolean {
    return !!this.reseller &&
           !!this.assignForm.clientId &&
           !!this.assignForm.deviceId &&
           this.assignForm.dureeMois >= 1 &&
           this.assignForm.prixUnitaire >= 0;
  }

  saveAssign() {
    if (!this.canSaveAssign || this.assignSaving || !this.reseller) return;
    this.assignSaving = true;
    this.assignError  = '';

    this.deviceService.assignDevice({
      resellerId:   this.reseller.idRev,
      clientId:     this.assignForm.clientId!,
      deviceId:     this.assignForm.deviceId!,
      dureeMois:    this.assignForm.dureeMois,
      prixUnitaire: this.assignForm.prixUnitaire,
    }).subscribe({
      next: () => {
        this.assignSaving    = false;
        this.showAssignModal = false;
        this.loadDevices(this.reseller!.idRev);
        this.loadLibreDevices(this.reseller!.idRev);
      },
      error: (err: any) => {
        this.assignSaving = false;
        this.assignError  = err.status === 409
          ? 'This device is no longer available.'
          : 'Assignment failed. Please try again.';
        console.error('Assign failed', err);
      }
    });
  }
}