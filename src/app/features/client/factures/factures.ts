// src/app/features/client/factures/factures.ts

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';
import { Facture, StatutFacture } from '../../../models/facture.model';
import { MOCK_FACTURES, getMontantTotal } from '../../../data/mock-data';

type FilterStatut = 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factures.html',
  styleUrl: './factures.css'
})
export default class FacturesComponent implements OnInit {

  // Services
  i18n = inject(TranslationService);

  // Signals
  factures = signal<Facture[]>([]);
  selectedFacture = signal<Facture | null>(null);
  showDetailsModal = signal(false);
  filterStatut = signal<FilterStatut>('ALL');

  // Computed
  filteredFactures = computed(() => {
    const filter = this.filterStatut();
    const allFactures = this.factures();

    switch (filter) {
      case 'PAID':
        return allFactures.filter(f => f.statut === StatutFacture.PAYEE);
      case 'PENDING':
        return allFactures.filter(f => f.statut === StatutFacture.EN_ATTENTE);
      case 'OVERDUE':
        return allFactures.filter(f => f.statut === StatutFacture.ECHUE);
      default:
        return allFactures;
    }
  });

  facturesStats = computed(() => {
    const allFactures = this.factures();
    return {
      total: allFactures.length,
      montantTotal: allFactures.reduce((sum, f) => sum + f.montantTTC, 0),
      payees: allFactures.filter(f => f.statut === StatutFacture.PAYEE).length,
      enAttente: allFactures.filter(f => f.statut === StatutFacture.EN_ATTENTE).length,
      echues: allFactures.filter(f => f.statut === StatutFacture.ECHUE).length
    };
  });

  // Expose enum
  StatutFacture = StatutFacture;

  ngOnInit() {
    // Load factures from mock data
    this.factures.set(MOCK_FACTURES);
  }

  // Filters
  setFilter(statut: FilterStatut) {
    this.filterStatut.set(statut);
  }

  isFilterActive(statut: FilterStatut): boolean {
    return this.filterStatut() === statut;
  }

  // Modal
  openDetails(facture: Facture) {
    this.selectedFacture.set(facture);
    this.showDetailsModal.set(true);
  }

  closeDetails() {
    this.showDetailsModal.set(false);
    this.selectedFacture.set(null);
  }

  // Actions
  telechargerFacture(facture: Facture) {
    console.log('Télécharger facture:', facture.numero);
    // TODO: API call pour générer et télécharger le PDF
    alert(`📥 Téléchargement de la facture ${facture.numero} en cours...`);
  }

  payerFacture(facture: Facture) {
    console.log('Payer facture:', facture.numero);
    const montantTotal = getMontantTotal(facture);
    // TODO: Ouvrir modal de paiement
    alert(`💳 Paiement de la facture ${facture.numero} - Montant: ${montantTotal} TND`);
  }

  // Helpers
  getStatutBadgeClass(statut: StatutFacture): string {
    switch (statut) {
      case StatutFacture.PAYEE:
        return 'badge-success';
      case StatutFacture.EN_ATTENTE:
        return 'badge-warning';
      case StatutFacture.ECHUE:
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  }

  getStatutLabel(statut: StatutFacture): string {
    switch (statut) {
      case StatutFacture.PAYEE:
        return this.i18n.t('inv_status_paid') || 'Payée';
      case StatutFacture.EN_ATTENTE:
        return this.i18n.t('inv_status_pending') || 'En attente';
      case StatutFacture.ECHUE:
        return this.i18n.t('inv_status_overdue') || 'Échue';
      default:
        return 'Inconnu';
    }
  }

  // Get jours restants for a facture
  getJoursRestants(facture: Facture): number {
    if (!facture.dateEcheance) return 0;

    const echeance = new Date(facture.dateEcheance).getTime();
    const maintenant = new Date().getTime();
    const diffMs = echeance - maintenant;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  // Check if facture is due soon
  isEchueSoon(facture: Facture): boolean {
    if (facture.statut !== StatutFacture.EN_ATTENTE) return false;
    const jours = this.getJoursRestants(facture);
    return jours > 0 && jours <= 3;
  }

  // Get montant total (wrapper for template)
  getMontantTotal(facture: Facture): number {
    return getMontantTotal(facture);
  }
}
