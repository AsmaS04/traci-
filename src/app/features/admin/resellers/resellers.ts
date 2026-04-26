import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reseller } from '../../../models/reseller.model';
import { Client } from '../../../models/client.model';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';

@Component({
  selector: 'app-resellers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resellers.html',
  styleUrl: './resellers.css',
})
export class Resellers implements OnInit {

  constructor(
    public i18n: TranslationService,
    private resellerService: ResellerService,
    private clientService: ClientService
  ) {}

  view: 'table' | 'detail' = 'table';
  selected: Reseller | null = null;
  selectedClients: Client[] = [];

  showModal       = false;
  showDeleteModal = false;
  modalMode: 'add' | 'edit' = 'add';
  toDelete: Reseller | null = null;
  formData: Partial<Reseller> = {};
  searchQuery = '';
  sortField: keyof Reseller = 'idRev';
  sortAsc = true;
  loading = true;

  resellers: Reseller[] = [];

  ngOnInit() { this.loadResellers(); }

  private loadResellers() {
    this.loading = true;
    this.resellerService.getAll().subscribe({
      next: (data) => { this.resellers = data; this.loading = false; },
      error: (err) => { console.error('Failed to load resellers', err); this.loading = false; }
    });
  }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }

  get activeCount():   number { return this.resellers.filter(r => (r.clientCount ?? 0) > 0).length; }
  get inactiveCount(): number { return this.resellers.filter(r => (r.clientCount ?? 0) === 0).length; }

  get filtered(): Reseller[] {
    const q = this.searchQuery.toLowerCase().trim();
    let list = [...this.resellers];
    if (q) list = list.filter(r =>
      (r.username ?? '').toLowerCase().includes(q) ||
      (r.nomEntreprise ?? '').toLowerCase().includes(q) ||
      (r.email ?? '').toLowerCase().includes(q) ||
      (r.phone ?? '').toLowerCase().includes(q) ||
      String(r.idRev).includes(q)
    );
    list.sort((a, b) => {
      const av = (a as any)[this.sortField] ?? '';
      const bv = (b as any)[this.sortField] ?? '';
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (this.sortAsc ? 1 : -1);
    });
    return list;
  }

  sortBy(field: keyof Reseller): void {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else { this.sortField = field; this.sortAsc = true; }
  }

  sortIcon(field: keyof Reseller): string {
    if (this.sortField !== field) return '↕';
    return this.sortAsc ? '↑' : '↓';
  }

  openDetail(r: Reseller): void {
    this.selected = r;
    this.view = 'detail';
    this.loadResellerClients(r.idRev);
  }

  private loadResellerClients(resellerId: number) {
    this.resellerService.getClientsByReseller(resellerId).subscribe({
      next: (data) => { this.selectedClients = data; },
      error: (err) => { console.error('Failed to load reseller clients', err); this.selectedClients = []; }
    });
  }

  backToTable(): void { this.view = 'table'; this.selected = null; this.selectedClients = []; }

  openAdd(): void { this.formData = {}; this.modalMode = 'add'; this.showModal = true; }

  openEdit(r: Reseller, e: Event): void {
    e.stopPropagation();
    this.formData  = { ...r };
    this.modalMode = 'edit';
    this.showModal = true;
  }

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get formEmailError(): string { return (this.formData.email ?? '') && !this.isValidEmail(this.formData.email ?? '') ? 'msg_error_invalid_email' : ''; }
  get formPhoneError(): string { return (this.formData.phone ?? '') && !this.isValidPhone(this.formData.phone ?? '') ? 'msg_error_invalid_phone' : ''; }

  saveForm(): void {
    if (!this.isValidEmail(this.formData.email ?? '') || !this.isValidPhone(this.formData.phone ?? '')) return;
    if (this.modalMode === 'add') {
      this.resellerService.create(this.formData).subscribe({
        next: () => { this.loadResellers(); this.closeModal(); },
        error: (err) => console.error('Failed to create reseller', err)
      });
    } else {
      if (!this.formData.idRev) return;
      this.resellerService.update(this.formData.idRev, this.formData).subscribe({
        next: (updated) => {
          this.loadResellers();
          if (this.selected?.idRev === updated.idRev) this.selected = updated;
          this.closeModal();
        },
        error: (err) => console.error('Failed to update reseller', err)
      });
    }
  }

  closeModal(): void { this.showModal = false; this.formData = {}; }

  askDelete(r: Reseller, e: Event): void { e.stopPropagation(); this.toDelete = r; this.showDeleteModal = true; }

  confirmDelete(): void {
    if (!this.toDelete) return;
    this.resellerService.delete(this.toDelete.idRev).subscribe({
      next: () => {
        if (this.selected?.idRev === this.toDelete!.idRev) this.backToTable();
        this.loadResellers();
        this.toDelete = null;
        this.showDeleteModal = false;
      },
      error: (err) => console.error('Failed to delete reseller', err)
    });
  }

  cancelDelete(): void { this.toDelete = null; this.showDeleteModal = false; }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' });
  }
}