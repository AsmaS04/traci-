import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';
import { ClientService, AbonnementDTO } from '../../../service/Client.service';
import { ToastService } from '../../../service/Toast.service';

type FilterStatut = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

@Component({
  selector: 'app-abonnements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abonnements.html',
  styleUrl: './abonnements.css'
})
export default class AbonnementsComponent implements OnInit {

  i18n                  = inject(TranslationService);
  private clientService = inject(ClientService);
  private toast         = inject(ToastService);

  abonnements        = signal<AbonnementDTO[]>([]);
  loading            = signal(true);
  selectedAbonnement = signal<AbonnementDTO | null>(null);
  showDetailsModal   = signal(false);
  filterStatut       = signal<FilterStatut>('ALL');

  private statusMap(status: string): 'ACTIVE' | 'EXPIRED' | 'CANCELLED' {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif') return 'ACTIVE';
    if (s === 'annulé' || s === 'suspendu') return 'CANCELLED';
    return 'EXPIRED';
  }

  filteredAbonnements = computed(() => {
    const filter = this.filterStatut();
    const all    = this.abonnements();
    if (filter === 'ALL') return all;
    return all.filter(a => this.statusMap(a.status) === filter);
  });

  abonnementsStats = computed(() => {
    const all = this.abonnements();
    return {
      total:   all.length,
      actifs:  all.filter(a => this.statusMap(a.status) === 'ACTIVE').length,
      expires: all.filter(a => this.statusMap(a.status) === 'EXPIRED').length,
      annules: all.filter(a => this.statusMap(a.status) === 'CANCELLED').length
    };
  });

  ngOnInit() {
    this.loading.set(true);
    this.clientService.getMyAbonnements().subscribe({
      next: (data: AbonnementDTO[]) => { this.abonnements.set(data); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load subscriptions.'); this.loading.set(false); }
    });
  }

  setFilter(s: FilterStatut)               { this.filterStatut.set(s); }
  isFilterActive(s: FilterStatut): boolean { return this.filterStatut() === s; }

  openDetails(abo: AbonnementDTO)  { this.selectedAbonnement.set(abo); this.showDetailsModal.set(true); }
  closeDetails()                   { this.showDetailsModal.set(false); this.selectedAbonnement.set(null); }

  statusBadgeClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')     return 'badge--active';
    if (s === 'expiré')    return 'badge--expired';
    if (s === 'completed') return 'badge--default';
    if (s === 'annulé' || s === 'suspendu') return 'badge--cancelled';
    return 'badge--default';
  }

  statusLabel(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'actif')     return 'Active';
    if (s === 'expiré')    return 'Expired';
    if (s === 'completed') return 'Completed';
    if (s === 'annulé')    return 'Cancelled';
    return status;
  }

  getProgressPercent(abo: AbonnementDTO): number {
    if ((abo.status ?? '').toLowerCase() !== 'actif') return 0;
    const start = new Date(abo.startDate).getTime();
    const end   = new Date(abo.endDate).getTime();
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
  }

  getRemainingPercent(abo: AbonnementDTO): number { return 100 - this.getProgressPercent(abo); }

  progressColor(abo: AbonnementDTO): string {
    const rem = abo.joursRestants ?? 0;
    const tot = (abo.dureeMois ?? 1) * 30;
    if (rem <= 0)         return '#7f1d1d';
    if (rem <= 7)         return '#DC2626';
    if (rem <= tot * 0.5) return '#D97706';
    return '#0D9488';
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}