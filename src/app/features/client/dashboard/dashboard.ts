// src/app/features/client/dashboard/dashboard.ts

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';
import {
  Abonnement,
  StatutAbonnement,
  isAbonnementExpiringSoon
} from '../../../models/abonnement.model';
import {
  Forfait,
  FORFAITS_DISPONIBLES
} from '../../../models/forfait.model';
import { PaymentComponent } from '../payment/payment';
import {
  MOCK_ABONNEMENT_ACTUEL,
  MOCK_USER,
  MOCK_STATS
} from '../../../data/mock-data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PaymentComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export default class DashboardComponent implements OnInit {

  // Services
  i18n = inject(TranslationService);

  // Signals
  abonnement = signal<Abonnement | null>(null);
  showWarningModal = signal(false);
  showProfileDropdown = signal(false);
  showForfaitsModal = signal(false);
  showPaymentModal = signal(false);
  selectedForfait = signal<Forfait | null>(null);
  selectedForfaitForPayment = signal<Forfait | null>(null);
  isLoading = signal(false);

  // Data
  forfaits = FORFAITS_DISPONIBLES;

  // Expose enums
  StatutAbonnement = StatutAbonnement;

  // User data from mock
  user = MOCK_USER;

  // Stats data from mock
  stats = MOCK_STATS;

  ngOnInit() {
    this.loadAbonnement();
  }

  loadAbonnement() {
    this.isLoading.set(true);

    // TODO: Remplacer par appel API
    setTimeout(() => {
      this.abonnement.set(MOCK_ABONNEMENT_ACTUEL);
      this.isLoading.set(false);

      // Show warning if expiring soon (≤7 days)
      if (isAbonnementExpiringSoon(MOCK_ABONNEMENT_ACTUEL.joursRestants)) {
        this.showWarningModal.set(true);
      }
    }, 500);
  }

  // Progress bar calculation
  getProgressPercentage(): number {
    const abo = this.abonnement();
    if (!abo) return 0;

    const debut = new Date(abo.dateDebut).getTime();
    const fin = new Date(abo.dateFin).getTime();
    const maintenant = new Date().getTime();

    const totalDuration = fin - debut;
    const elapsed = maintenant - debut;

    const percentage = (elapsed / totalDuration) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  getProgressColor(): string {
    const abo = this.abonnement();
    if (!abo) return 'safe';

    if (abo.joursRestants > 7) {
      return 'safe';
    } else if (abo.joursRestants > 3) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  getCountdownColor(): string {
    const abo = this.abonnement();
    if (!abo) return 'safe';

    if (abo.joursRestants > 7) {
      return 'safe';
    } else if (abo.joursRestants > 3) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  // Profile dropdown
  toggleProfileDropdown() {
    this.showProfileDropdown.set(!this.showProfileDropdown());
  }

  closeProfileDropdown() {
    this.showProfileDropdown.set(false);
  }

  // Warning modal
  closeWarningModal() {
    this.showWarningModal.set(false);
  }

  // Forfaits modal
  openForfaitsModal() {
    this.showForfaitsModal.set(true);
    this.showWarningModal.set(false);
  }

  closeForfaitsModal() {
    this.showForfaitsModal.set(false);
    this.selectedForfait.set(null);
  }

  selectForfait(forfait: Forfait) {
    this.selectedForfaitForPayment.set(forfait);
    this.closeForfaitsModal();
    this.showPaymentModal.set(true);
  }

  // Payment success handler
  onPaymentSuccess(data: any) {
    console.log('Payment success:', data);
    this.showPaymentModal.set(false);

    // TODO: API call pour créer l'abonnement avec data.orderId
    alert(`✅ Paiement réussi!\n\nOrder ID: ${data.orderId}\nMontant: ${data.amount} TND\nMéthode: ${data.method}\n\nVotre abonnement sera activé dans quelques instants.`);

    // Reload abonnement data
    this.loadAbonnement();
  }

  // Actions
  demanderProlongation() {
    console.log('Demander prolongation de 10 jours');

    // TODO: API call
    this.closeWarningModal();
    alert('✅ Demande de prolongation envoyée!\n\nVous recevrez une confirmation par email sous 24h.');
  }

  telechargerFacture() {
    console.log('Télécharger facture');

    // TODO: API call pour générer et télécharger le PDF
    alert('📥 Téléchargement de la facture en cours...');
  }

  logout() {
    console.log('Déconnexion');
    // TODO: Implémenter la déconnexion
    alert('👋 Déconnexion...');
  }

  // Helper
  isExpiringSoon = isAbonnementExpiringSoon;
}
