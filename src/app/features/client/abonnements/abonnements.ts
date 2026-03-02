// src/app/features/client/abonnements/abonnements.ts

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';
import { Abonnement, StatutAbonnement } from '../../../models/abonnement.model';
import { MOCK_ABONNEMENTS } from '../../../data/mock-data';

type FilterStatut = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

@Component({
  selector: 'app-abonnements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abonnements.html',
  styleUrl: './abonnements.css'
})
export default class AbonnementsComponent implements OnInit {

  // Services
  i18n = inject(TranslationService);

  // Signals
  abonnements = signal<Abonnement[]>([]);
  selectedAbonnement = signal<Abonnement | null>(null);
  showDetailsModal = signal(false);
  filterStatut = signal<FilterStatut>('ALL');

  // Computed
  filteredAbonnements = computed(() => {
    const filter = this.filterStatut();
    const allAbonnements = this.abonnements();

    switch (filter) {
      case 'ACTIVE':
        return allAbonnements.filter(a => a.statut === StatutAbonnement.ACTIF);
      case 'EXPIRED':
        return allAbonnements.filter(a => a.statut === StatutAbonnement.EXPIRE);
      case 'CANCELLED':
        return allAbonnements.filter(a => a.statut === StatutAbonnement.ANNULE);
      default:
        return allAbonnements;
    }
  });

  abonnementsStats = computed(() => {
    const allAbonnements = this.abonnements();
    return {
      total: allAbonnements.length,
      actifs: allAbonnements.filter(a => a.statut === StatutAbonnement.ACTIF).length,
      expires: allAbonnements.filter(a => a.statut === StatutAbonnement.EXPIRE).length,
      annules: allAbonnements.filter(a => a.statut === StatutAbonnement.ANNULE).length
    };
  });

  // Expose enum
  StatutAbonnement = StatutAbonnement;

  ngOnInit() {
    // Load abonnements from mock data
    this.abonnements.set(MOCK_ABONNEMENTS);
  }

  // Filters
  setFilter(statut: FilterStatut) {
    this.filterStatut.set(statut);
  }

  isFilterActive(statut: FilterStatut): boolean {
    return this.filterStatut() === statut;
  }

  // Modal
  openDetails(abonnement: Abonnement) {
    this.selectedAbonnement.set(abonnement);
    this.showDetailsModal.set(true);
  }

  closeDetails() {
    this.showDetailsModal.set(false);
    this.selectedAbonnement.set(null);
  }

  // Actions
  renouvelerAbonnement(abonnement: Abonnement) {
    console.log('Renouveler abonnement:', abonnement.id);
    // TODO: Ouvrir modal de sélection forfait + paiement
    alert(`🔄 Renouvellement de l'abonnement ${abonnement.serviceNom}\n\nVous serez redirigé vers la page de paiement.`);
  }

  // Helpers
  getStatutBadgeClass(statut: StatutAbonnement): string {
    switch (statut) {
      case StatutAbonnement.ACTIF:
        return 'badge-success';
      case StatutAbonnement.EXPIRE:
        return 'badge-warning';
      case StatutAbonnement.ANNULE:
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  }

  getStatutLabel(statut: StatutAbonnement): string {
    switch (statut) {
      case StatutAbonnement.ACTIF:
        return this.i18n.t('status_active') || 'Actif';
      case StatutAbonnement.EXPIRE:
        return this.i18n.t('status_expired') || 'Expiré';
      case StatutAbonnement.ANNULE:
        return this.i18n.t('status_cancelled') || 'Annulé';
      default:
        return 'Inconnu';
    }
  }

  getProgressPercentage(abonnement: Abonnement): number {
    if (abonnement.statut !== StatutAbonnement.ACTIF) {
      return abonnement.statut === StatutAbonnement.EXPIRE ? 100 : 0;
    }

    const debut = new Date(abonnement.dateDebut).getTime();
    const fin = new Date(abonnement.dateFin).getTime();
    const maintenant = new Date().getTime();

    const totalDuration = fin - debut;
    const elapsed = maintenant - debut;

    const percentage = (elapsed / totalDuration) * 100;
    return Math.min(100, Math.max(0, percentage));
  }
}
