import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../../service/translation.service';
import { ToastService } from '../../../service/Toast.service';

export interface FactureDTO {
  id: number;
  odooMoveId: number;
  invoiceNumber: string;
  clientId: number;
  invoiceDate: string;
  dueDate: string;
  amountUntaxed: number;
  taxAmount: number;
  total: number;
  status: string;
  serviceLabel: string;
}

type FilterStatut = 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factures.html',
  styleUrl: './factures.css'
})
export default class FacturesComponent implements OnInit {

  i18n          = inject(TranslationService);
  private toast  = inject(ToastService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  factures         = signal<FactureDTO[]>([]);
  loading          = signal(true);
  selectedFacture  = signal<FactureDTO | null>(null);
  showDetailsModal = signal(false);
  filterStatut     = signal<FilterStatut>('ALL');

  private statusMap(s: string): 'PAID' | 'PENDING' | 'OVERDUE' {
    if (s === 'paid')   return 'PAID';
    if (s === 'posted') return 'PENDING';
    return 'OVERDUE';
  }

  filteredFactures = computed(() => {
    const filter = this.filterStatut();
    const all    = this.factures();
    if (filter === 'ALL') return all;
    return all.filter(f => this.statusMap(f.status) === filter);
  });

  facturesStats = computed(() => {
    const all = this.factures();
    return {
      total:        all.length,
      montantTotal: all.reduce((s, f) => s + (f.total ?? 0), 0),
      payees:       all.filter(f => f.status === 'paid').length,
      enAttente:    all.filter(f => f.status === 'posted').length
    };
  });

  ngOnInit() {
    this.handleStripeReturn();
    this.loadFactures();
  }

  private loadFactures() {
    this.loading.set(true);
    this.http.get<FactureDTO[]>('http://localhost:8080/api/client/factures/my').subscribe({
      next: (data) => { this.factures.set(data); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load invoices.'); this.loading.set(false); }
    });
  }

  private handleStripeReturn() {
    const status = this.route.snapshot.queryParamMap.get('payment');
    if (status === 'success') {
      this.toast.success('Paiement confirmé — abonnement renouvelé et facture envoyée par email.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  setFilter(s: FilterStatut)               { this.filterStatut.set(s); }
  isFilterActive(s: FilterStatut): boolean { return this.filterStatut() === s; }

  openDetails(f: FactureDTO)  { this.selectedFacture.set(f); this.showDetailsModal.set(true); }
  closeDetails()              { this.showDetailsModal.set(false); this.selectedFacture.set(null); }

  telechargerFacture(f: FactureDTO) {
    this.toast.info(`Download INV-${f.id} — PDF coming soon.`);
  }

  statusBadgeClass(s: string): string {
    if (s === 'paid')   return 'badge--paid';
    if (s === 'posted') return 'badge--pending';
    return 'badge--overdue';
  }

  statusLabel(s: string): string {
    if (s === 'paid')   return 'Paid';
    if (s === 'posted') return 'Pending';
    if (s === 'draft')  return 'Draft';
    return s;
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}