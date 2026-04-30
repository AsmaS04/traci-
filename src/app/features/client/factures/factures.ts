import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';
import { ClientService, PaiementDTO } from '../../../service/Client.service';
import { ToastService } from '../../../service/Toast.service';

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
  private clientService = inject(ClientService);
  private toast         = inject(ToastService);

  payments         = signal<PaiementDTO[]>([]);
  loading          = signal(true);
  selectedFacture  = signal<PaiementDTO | null>(null);
  showDetailsModal = signal(false);
  filterStatut     = signal<FilterStatut>('ALL');

  private statusMap(s: string): 'PAID' | 'PENDING' | 'OVERDUE' {
    if (s === 'completed') return 'PAID';
    if (s === 'pending')   return 'PENDING';
    return 'OVERDUE';
  }

  filteredFactures = computed(() => {
    const f   = this.filterStatut();
    const all = this.payments();
    if (f === 'ALL') return all;
    return all.filter(p => this.statusMap(p.paymentStatus) === f);
  });

  facturesStats = computed(() => {
    const all = this.payments();
    return {
      total:        all.length,
      montantTotal: all.reduce((s, p) => s + (p.amount ?? 0), 0),
      payees:       all.filter(p => p.paymentStatus === 'completed').length,
      enAttente:    all.filter(p => p.paymentStatus === 'pending').length
    };
  });

  ngOnInit() {
    this.loading.set(true);
    this.clientService.getMyPayments().subscribe({
      next: (data: PaiementDTO[]) => { this.payments.set(data); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load invoices.'); this.loading.set(false); }
    });
  }

  setFilter(s: FilterStatut)               { this.filterStatut.set(s); }
  isFilterActive(s: FilterStatut): boolean { return this.filterStatut() === s; }

  openDetails(p: PaiementDTO)  { this.selectedFacture.set(p); this.showDetailsModal.set(true); }
  closeDetails()               { this.showDetailsModal.set(false); this.selectedFacture.set(null); }

  telechargerFacture(p: PaiementDTO) {
    this.toast.info(`Download for ${p.payRef} — Odoo integration coming soon.`);
  }

  payerFacture(p: PaiementDTO) {
    this.toast.info(`Payment for ${p.payRef} (${p.amount} TND) — Konnect integration coming soon.`);
  }

  statusBadgeClass(s: string): string {
    if (s === 'completed') return 'badge--paid';
    if (s === 'pending')   return 'badge--pending';
    return 'badge--overdue';
  }

  statusLabel(s: string): string {
    if (s === 'completed') return 'Paid';
    if (s === 'pending')   return 'Pending';
    if (s === 'failed')    return 'Failed';
    return s;
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}