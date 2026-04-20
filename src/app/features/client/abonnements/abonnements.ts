import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';
import { ClientService, AbonnementDTO } from '../../../service/Client.service';

type FilterStatut = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

@Component({
  selector: 'app-abonnements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abonnements.html',
  styleUrl: './abonnements.css'
})
export default class AbonnementsComponent implements OnInit {

  i18n = inject(TranslationService);
  private clientService = inject(ClientService);

  abonnements = signal<AbonnementDTO[]>([]);
  selectedAbonnement = signal<AbonnementDTO | null>(null);
  showDetailsModal = signal(false);
  filterStatut = signal<FilterStatut>('ALL');

  // Map DB status to filter categories
  private statusMap(status: string): 'ACTIVE' | 'EXPIRED' | 'CANCELLED' {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif') return 'ACTIVE';
    if (s === 'annulé' || s === 'suspendu') return 'CANCELLED';
    return 'EXPIRED'; // expiré or anything else
  }

  filteredAbonnements = computed(() => {
    const filter = this.filterStatut();
    const all = this.abonnements();
    if (filter === 'ALL') return all;
    return all.filter(a => this.statusMap(a.status) === filter);
  });

  abonnementsStats = computed(() => {
    const all = this.abonnements();
    return {
      total: all.length,
      actifs: all.filter(a => this.statusMap(a.status) === 'ACTIVE').length,
      expires: all.filter(a => this.statusMap(a.status) === 'EXPIRED').length,
      annules: all.filter(a => this.statusMap(a.status) === 'CANCELLED').length
    };
  });

  // Expose for template compatibility
  StatutAbonnement = { ACTIF: 'actif', EXPIRE: 'expiré', ANNULE: 'annulé' };

  ngOnInit() {
    this.clientService.getMyAbonnements().subscribe({
      next: (data: AbonnementDTO[]) => this.abonnements.set(data),
      error: (err: any) => console.error('Failed to load abonnements', err)
    });
  }

  setFilter(statut: FilterStatut) { this.filterStatut.set(statut); }
  isFilterActive(statut: FilterStatut): boolean { return this.filterStatut() === statut; }

  openDetails(abo: AbonnementDTO) {
    this.selectedAbonnement.set(abo);
    this.showDetailsModal.set(true);
  }

  closeDetails() {
    this.showDetailsModal.set(false);
    this.selectedAbonnement.set(null);
  }

  renouvelerAbonnement(abo: AbonnementDTO) {
    alert(`🔄 Renouvellement de l'abonnement #${abo.idAbo}\nRedirection vers la page de paiement...`);
    // TODO: open forfait selection → payment flow
  }

  getStatutBadgeClass(statut: string): string {
    const s = (statut ?? '').toLowerCase();
    if (s === 'actif') return 'badge-success';
    if (s === 'expiré') return 'badge-warning';
    if (s === 'annulé' || s === 'suspendu') return 'badge-danger';
    return 'badge-default';
  }

  getStatutLabel(statut: string): string {
    const s = (statut ?? '').toLowerCase();
    if (s === 'actif') return this.i18n.t('status_active') || 'Actif';
    if (s === 'expiré') return this.i18n.t('status_expired') || 'Expiré';
    if (s === 'annulé') return this.i18n.t('status_cancelled') || 'Annulé';
    if (s === 'suspendu') return 'Suspendu';
    return statut;
  }

  getProgressPercentage(abo: AbonnementDTO): number {
    if ((abo.status ?? '').toLowerCase() !== 'actif') {
      return (abo.status ?? '').toLowerCase() === 'expiré' ? 100 : 0;
    }
    const debut = new Date(abo.startDate).getTime();
    const fin = new Date(abo.endDate).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - debut) / (fin - debut)) * 100));
  }
}