import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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
export class Resellers implements OnInit, OnDestroy {

  constructor(
    public i18n: TranslationService,
    private resellerService: ResellerService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  private emailCheckTimeout: any = null;

  view: 'table' | 'detail' = 'table';
  selected: Reseller | null = null;
  selectedClients: Client[] = [];

  showModal     = false;
  modalMode: 'add' | 'edit' = 'add';
  formData: Partial<Reseller> = {};
  searchQuery   = '';
  sortField: keyof Reseller = 'idRev';
  sortAsc       = true;
  loading       = true;

  pendingRequests   = signal<any[]>([]);
  processingRequest = signal<number | null>(null);

  showSuspendModal = false;
  suspendTarget: Reseller | null = null;
  suspendSuggestions: any[] = [];
  suspendResellers: any[]   = [];
  suspendLoading            = false;
  suspendClientAssignments: { [key: number]: number } = {};
  bulkResellerId: number | null = null;

  resellers: Reseller[] = [];
  formEmailExists = false;
  private originalEmail = '';

  readonly governorates = [
    'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
    'Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine',
    'Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse',
    'Tataouine','Tozeur','Tunis','Zaghouan'
  ];

  ngOnInit() {
    this.loading = true;
    this.resellerService.getAll().subscribe({
      next: (data) => {
        this.resellers = data;
        this.loading   = false;
        this.loadPendingRequests();
        const idParam = this.route.snapshot.queryParamMap.get('id');
        if (idParam) {
          const target = data.find(r => r.idRev === +idParam);
          if (target) this.openDetail(target);
        }
      },
      error: (err) => { console.error('Failed to load resellers', err); this.loading = false; }
    });
  }

  ngOnDestroy() {
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
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
    this.view     = 'detail';
    this.loadResellerClients(r.idRev);
  }

  private loadResellerClients(resellerId: number) {
    this.resellerService.getClientsByReseller(resellerId).subscribe({
      next: (data) => { this.selectedClients = data; },
      error: (err) => { console.error('Failed to load reseller clients', err); this.selectedClients = []; }
    });
  }

  backToTable(): void { this.view = 'table'; this.selected = null; this.selectedClients = []; }

  openAdd(): void {
    this.formData       = {};
    this.formEmailExists = false;
    this.originalEmail  = '';
    this.modalMode      = 'add';
    this.showModal      = true;
  }

  openEdit(r: Reseller, e: Event): void {
    e.stopPropagation();
    this.formData       = { ...r };
    this.originalEmail  = r.email ?? '';
    this.formEmailExists = false;
    this.modalMode      = 'edit';
    this.showModal      = true;
  }

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }

  get formEmailError(): string {
    const email = this.formData.email ?? '';
    if (!email) return '';
    if (!this.isValidEmail(email)) return 'msg_error_invalid_email';
    if (this.formEmailExists) return 'msg_error_email_taken';
    return '';
  }

  get formPhoneError(): string {
    return (this.formData.phone ?? '') && !this.isValidPhone(this.formData.phone ?? '')
      ? 'msg_error_invalid_phone' : '';
  }

  onEmailChange(): void {
    this.formEmailExists = false;
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
    const email = this.formData.email ?? '';
    if (!this.isValidEmail(email)) return;
    if (this.modalMode === 'edit' && email.trim().toLowerCase() === this.originalEmail.trim().toLowerCase()) return;
    this.emailCheckTimeout = setTimeout(() => {
      this.resellerService.checkEmail(email).subscribe({
        next: (res) => { this.formEmailExists = res.exists; },
        error: () => { this.formEmailExists = false; }
      });
    }, 400);
  }

  saveForm(): void {
    if (
      !this.isValidEmail(this.formData.email ?? '') ||
      !this.isValidPhone(this.formData.phone ?? '') ||
      this.formEmailExists
    ) return;

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

  private loadResellers() {
    this.loading = true;
    this.resellerService.getAll().subscribe({
      next: (data) => { this.resellers = data; this.loading = false; },
      error: (err) => { console.error('Failed to load resellers', err); this.loading = false; }
    });
  }

  closeModal(): void {
    this.showModal      = false;
    this.formData       = {};
    this.formEmailExists = false;
    this.originalEmail  = '';
    if (this.emailCheckTimeout) clearTimeout(this.emailCheckTimeout);
  }

  isSuspended(r: Reseller): boolean { return r.status === 'SUSPENDED'; }

  openSuspendModal(r: Reseller, e: Event): void {
    e.stopPropagation();
    this.suspendTarget    = r;
    this.suspendLoading   = true;
    this.showSuspendModal = true;
    this.suspendClientAssignments = {};
    this.bulkResellerId   = null;
    this.resellerService.getReassignSuggestions(r.idRev).subscribe({
      next: (data) => {
        this.suspendSuggestions = data.clients;
        this.suspendResellers   = data.resellers;
        data.clients.forEach((c: any) => {
          if (c.suggestedResellerId) this.suspendClientAssignments[c.clientId] = c.suggestedResellerId;
        });
        this.suspendLoading = false;
      },
      error: () => { this.suspendLoading = false; }
    });
  }

  closeSuspendModal(): void {
    this.showSuspendModal   = false;
    this.suspendTarget      = null;
    this.suspendSuggestions = [];
    this.suspendResellers   = [];
    this.suspendClientAssignments = {};
    this.bulkResellerId     = null;
  }

  applyBulkAssign(): void {
    if (!this.bulkResellerId) return;
    this.suspendSuggestions.forEach(c => {
      this.suspendClientAssignments[c.clientId] = this.bulkResellerId!;
    });
  }

  confirmSuspend(): void {
    if (!this.suspendTarget) return;
    const reassignCalls = this.suspendSuggestions
      .filter(c => this.suspendClientAssignments[c.clientId])
      .map(c => this.clientService.reassignClient(c.clientId, this.suspendClientAssignments[c.clientId]));

    const doSuspend = () => {
      this.resellerService.suspend(this.suspendTarget!.idRev).subscribe({
        next: () => { this.loadResellers(); this.closeSuspendModal(); },
        error: (err) => console.error('Failed to suspend reseller', err)
      });
    };

    if (reassignCalls.length > 0) {
      forkJoin(reassignCalls).subscribe({ next: doSuspend, error: doSuspend });
    } else {
      doSuspend();
    }
  }

  openReactivate(r: Reseller, e: Event): void {
    e.stopPropagation();
    this.resellerService.reactivate(r.idRev).subscribe({
      next: () => { this.loadResellers(); },
      error: (err) => console.error('Failed to reactivate reseller', err)
    });
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  navigateTo(path: string) { this.router.navigate([path]); }

  // ── Access Requests ───────────────────────────────────────
  private loadPendingRequests() {
    this.http.get<any[]>('http://localhost:8080/api/request-access/reseller/pending')
      .subscribe({
        next: (data) => this.pendingRequests.set(data.filter(r => r.status === 'PENDING')),
        error: () => {}
      });
  }

  regeneratePassword(req: any) {
    this.processingRequest.set(req.id);
    this.http.post(`http://localhost:8080/api/request-access/regenerate-password/${req.id}`, {})
      .subscribe({
        next: () => { this.processingRequest.set(null); this.loadPendingRequests(); },
        error: () => { this.processingRequest.set(null); }
      });
  }

  formatReqDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-TN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
}