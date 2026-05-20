import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../models/device.model';
import { TranslationService } from '../../../service/translation.service';
import { DeviceService } from '../../../service/Device.service';
import { DeviceRequestService, DeviceRequestDTO } from '../../../service/DeviceRequest.service';
import { ToastService } from '../../../service/Toast.service';

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
    private deviceService: DeviceService,
    private deviceRequestService: DeviceRequestService,
    private toast: ToastService
  ) {}

  devices: Device[] = [];
  loading = true;

  search = '';
  filterStatus: 'all' | 'actif' | 'inactif' | 'libre' | 'unassigned' = 'all';
  filterModel = 'all';

  panelOpen = false;
  panelDevice: Device | null = null;

  // ── Device requests ───────────────────────────────────
  pendingRequests: DeviceRequestDTO[] = [];
  showRequestsPanel = false;

  // Fulfill modal
  showFulfillModal  = false;
  fulfillTarget: DeviceRequestDTO | null = null;
  fulfillCount      = 1;
  unassignedCount   = 0;

  ngOnInit() {
    this.loadDevices();
    this.loadPendingRequests();
  }

  private loadDevices() {
    this.loading = true;
    this.deviceService.getAll().subscribe({
      next: (data) => { this.devices = data; this.loading = false; },
      error: (err) => { console.error('Failed to load devices', err); this.loading = false; }
    });
  }

  loadPendingRequests() {
    this.deviceRequestService.getPendingRequests().subscribe({
      next: (data) => {
        this.pendingRequests = data;
        if (data.length > 0) this.unassignedCount = data[0].unassignedAvailable;
      },
      error: (err) => console.error('Failed to load requests', err)
    });
  }

  // ── Filters & computed ────────────────────────────────
  get modelOptions(): string[] {
    const models = new Set<string>();
    this.devices.forEach(d => { if (d.model) models.add(d.model); });
    return ['all', ...Array.from(models)];
  }

  get filtered(): Device[] {
    const q = this.search.toLowerCase().trim();
    return this.devices.filter(d => {
      const matchQ = !q ||
        String(d.numDevice ?? '').toLowerCase().includes(q) ||
        (d.imei ?? '').toLowerCase().includes(q) ||
        (d.model ?? '').toLowerCase().includes(q) ||
        (d.clientName ?? '').toLowerCase().includes(q) ||
        String(d.idDevice).includes(q);
      const matchStatus = this.filterStatus === 'all' || (d.status ?? '').toLowerCase() === this.filterStatus;
      const matchModel  = this.filterModel  === 'all' || d.model === this.filterModel;
      return matchQ && matchStatus && matchModel;
    });
  }

  get totalCount()       { return this.devices.length; }
  get activeCount()      { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'actif').length; }
  get inactiveCount()    { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'inactif').length; }
  get libreCount()       { return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'libre').length; }
  get unassignedDbCount(){ return this.devices.filter(d => (d.status ?? '').toLowerCase() === 'unassigned').length; }

  statusClass(status: string | null | undefined): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')      return 'status--active';
    if (s === 'expiré')     return 'status--expired'; // keep for existing devices
    if (s === 'libre')      return 'status--libre';
    if (s === 'unassigned') return 'status--unassigned';
    return 'status--inactive';
  }

  modelColor(model: string | null | undefined): string {
    const m = (model ?? '').toLowerCase();
    if (m.includes('pro'))  return 'model--pro';
    if (m.includes('box'))  return 'model--box';
    if (m.includes('mini')) return 'model--mini';
    if (m.includes('lite')) return 'model--lite';
    return 'model--box';
  }

  openPanel(d: Device)  { this.panelDevice = d; this.panelOpen = true; }
  closePanel()          { this.panelOpen = false; setTimeout(() => { this.panelDevice = null; }, 300); }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-TN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // ── Fulfill modal ─────────────────────────────────────
  openFulfill(req: DeviceRequestDTO) {
    this.fulfillTarget = req;
    this.fulfillCount  = Math.min(req.requestedCount, req.unassignedAvailable);
    this.showFulfillModal = true;
  }

  closeFulfillModal() {
    this.showFulfillModal = false;
    this.fulfillTarget = null;
  }

  confirmFulfill() {
    if (!this.fulfillTarget) return;
    if (this.fulfillCount < 1 || this.fulfillCount > this.fulfillTarget.unassignedAvailable) return;

    this.deviceRequestService.fulfill(this.fulfillTarget.id, this.fulfillCount).subscribe({
      next: () => {
        this.toast.success(`${this.fulfillCount} devices sent to ${this.fulfillTarget!.resellerName}`);
        this.closeFulfillModal();
        this.loadDevices();
        this.loadPendingRequests();
      },
      error: (err) => {
        console.error('Failed to fulfill request', err);
        this.toast.error('Failed to fulfill request');
      }
    });
  }

  rejectRequest(req: DeviceRequestDTO) {
    this.deviceRequestService.reject(req.id).subscribe({
      next: () => {
        this.toast.success('Request rejected');
        this.loadPendingRequests();
      },
      error: (err) => console.error('Failed to reject', err)
    });
  }

  // ── Pagination ──────────────────────────────────────────
  currentPage = 1;
  pageSize    = 10;

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }

  get paginated(): Device[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get pageNumbers(): (number | '...')[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (this.currentPage <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (this.currentPage >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
    return [1, '...', this.currentPage-1, this.currentPage, this.currentPage+1, '...', total];
  }

  goToPage(p: number | '...'): void { if (p !== '...') this.currentPage = p as number; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  onPageSizeChange(): void { this.currentPage = 1; }
}