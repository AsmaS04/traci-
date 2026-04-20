import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';
import { ClientService, PaiementDTO } from '../../../service/Client.service';

type FilterStatut = 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factures.html',
  styleUrl: './factures.css'
})
export default class FacturesComponent implements OnInit {

  i18n = inject(TranslationService);
  private clientService = inject(ClientService);

  // We display payments as "factures" until Odoo is integrated
  payments = signal<PaiementDTO[]>([]);
  selectedFacture = signal<PaiementDTO | null>(null);
  showDetailsModal = signal(false);
  filterStatut = signal<FilterStatut>('ALL');

  // Map payment status to filter
  private statusMap(s: string): 'PAID' | 'PENDING' | 'OVERDUE' {
    if (s === 'completed') return 'PAID';
    if (s === 'pending') return 'PENDING';
    return 'OVERDUE'; // failed, refunded
  }

  filteredFactures = computed(() => {
    const filter = this.filterStatut();
    const all = this.payments();
    if (filter === 'ALL') return all;
    return all.filter(p => this.statusMap(p.paymentStatus) === filter);
  });

  facturesStats = computed(() => {
    const all = this.payments();
    return {
      total: all.length,
      montantTotal: all.reduce((s, p) => s + (p.amount ?? 0), 0),
      payees: all.filter(p => p.paymentStatus === 'completed').length,
      enAttente: all.filter(p => p.paymentStatus === 'pending').length
    };
  });

  // For template compatibility
  StatutFacture = { PAYEE: 'completed', EN_ATTENTE: 'pending', ECHUE: 'failed' };

  ngOnInit() {
    this.clientService.getMyPayments().subscribe({
      next: (data: PaiementDTO[]) => this.payments.set(data),
      error: (err: any) => console.error('Failed to load payments', err)
    });
  }

  setFilter(statut: FilterStatut) { this.filterStatut.set(statut); }
  isFilterActive(statut: FilterStatut): boolean { return this.filterStatut() === statut; }

  openDetails(p: PaiementDTO) {
    this.selectedFacture.set(p);
    this.showDetailsModal.set(true);
  }

  closeDetails() {
    this.showDetailsModal.set(false);
    this.selectedFacture.set(null);
  }

  telechargerFacture(p: PaiementDTO) {
    alert(`📥 Téléchargement facture ${p.payRef}...`);
    // TODO: Odoo integration — generate PDF
  }

  payerFacture(p: PaiementDTO) {
    alert(`💳 Paiement ${p.payRef} — Montant: ${p.amount} TND`);
    // TODO: Konnect redirect
  }

  getStatutBadgeClass(statut: string): string {
    if (statut === 'completed') return 'badge-success';
    if (statut === 'pending') return 'badge-warning';
    return 'badge-danger';
  }

  getStatutLabel(statut: string): string {
    if (statut === 'completed') return this.i18n.t('inv_status_paid') || 'Payée';
    if (statut === 'pending') return this.i18n.t('inv_status_pending') || 'En attente';
    if (statut === 'failed') return this.i18n.t('inv_status_overdue') || 'Échouée';
    if (statut === 'refunded') return 'Remboursée';
    return statut;
  }

  getJoursRestants(_p: PaiementDTO): number { return 0; }
  isEchueSoon(_p: PaiementDTO): boolean { return false; }
  getMontantTotal(p: PaiementDTO): number { return p.amount ?? 0; }
}