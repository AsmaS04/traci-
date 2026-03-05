// src/app/features/client/dashboard/dashboard.ts

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

export interface RecentInvoice {
  id: string; date: string; amount: number; status: 'paid' | 'pending' | 'overdue';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PaymentComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export default class DashboardComponent implements OnInit {

  // Services
  i18n   = inject(TranslationService);
  router = inject(Router);

  // Signals — all original, unchanged
  abonnement                = signal<Abonnement | null>(null);
  showWarningModal          = signal(false);
  showProfileDropdown       = signal(false);
  showForfaitsModal         = signal(false);
  showPaymentModal          = signal(false);
  selectedForfait           = signal<Forfait | null>(null);
  selectedForfaitForPayment = signal<Forfait | null>(null);
  isLoading                 = signal(false);

  // Data
  forfaits = FORFAITS_DISPONIBLES;
  user     = MOCK_USER;
  stats    = MOCK_STATS;

  recentInvoices: RecentInvoice[] = [
    { id: 'INV-2026-006', date: '01 Jan 2026', amount: 220, status: 'paid'    },
    { id: 'INV-2025-005', date: '01 Oct 2025', amount: 220, status: 'paid'    },
    { id: 'INV-2025-004', date: '01 Jul 2025', amount: 200, status: 'pending' },
  ];

  // Expose enums
  StatutAbonnement = StatutAbonnement;

  // ── NEW: Urgency helpers ──────────────────────────────────
  get daysLeft(): number {
    const abo = this.abonnement();
    return abo ? Math.max(0, abo.joursRestants) : 0;
  }

  /** Returns 'safe' | 'warning' | 'danger' — matches existing CSS class names */
  getCountdownColor(): string {
    if (this.daysLeft <= 0)  return 'danger';
    if (this.daysLeft < 7)   return 'danger';
    if (this.daysLeft <= 15) return 'warning';
    return 'safe';
  }

  get urgencyColor(): string {
    const map: Record<string, string> = { safe: '#0D9488', warning: '#D97706', danger: '#DC2626' };
    return map[this.getCountdownColor()] ?? '#0D9488';
  }

  get showExpiryBanner(): boolean {
    return this.daysLeft > 0 && this.daysLeft <= 15;
  }

  get contextualSubtitle(): string {
    const abo = this.abonnement();
    if (!abo) return this.i18n.t('dash_overview');
    const dateStr = new Date(abo.dateFin).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (this.daysLeft <= 0)  return this.i18n.t('dash_msg_expired');
    if (this.daysLeft < 7)   return this.i18n.t('dash_msg_critical').replace('{n}', String(this.daysLeft));
    if (this.daysLeft <= 15) return this.i18n.t('dash_msg_expiring').replace('{n}', String(this.daysLeft));
    return this.i18n.t('dash_msg_active').replace('{date}', dateStr);
  }

  get statusLabel(): 'active' | 'expiring' | 'expired' {
    if (this.daysLeft <= 0)  return 'expired';
    if (this.daysLeft <= 15) return 'expiring';
    return 'active';
  }

  get gracePeriodDays(): number { return 10; }

  invoiceStatusClass(s: string): string {
    if (s === 'paid')    return 'inv--paid';
    if (s === 'pending') return 'inv--pending';
    return 'inv--overdue';
  }

  // ── Progress bar (original logic preserved) ───────────────
  getProgressPercentage(): number {
    const abo = this.abonnement();
    if (!abo) return 0;
    const debut = new Date(abo.dateDebut).getTime();
    const fin   = new Date(abo.dateFin).getTime();
    const now   = Date.now();
    return Math.min(100, Math.max(0, Math.round(((now - debut) / (fin - debut)) * 100)));
  }

  getProgressColor(): string { return this.getCountdownColor(); }

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit() { this.loadAbonnement(); }

  loadAbonnement() {
    this.isLoading.set(true);
    // TODO: Replace with real API call
    setTimeout(() => {
      this.abonnement.set(MOCK_ABONNEMENT_ACTUEL);
      this.isLoading.set(false);
      if (isAbonnementExpiringSoon(MOCK_ABONNEMENT_ACTUEL.joursRestants)) {
        this.showWarningModal.set(true);
      }
    }, 700);
  }

  // ── Profile dropdown ──────────────────────────────────────
  toggleProfileDropdown() { this.showProfileDropdown.set(!this.showProfileDropdown()); }
  closeProfileDropdown()  { this.showProfileDropdown.set(false); }

  // ── Warning modal ─────────────────────────────────────────
  closeWarningModal() { this.showWarningModal.set(false); }

  // ── Forfaits modal ────────────────────────────────────────
  openForfaitsModal()  { this.showForfaitsModal.set(true); this.showWarningModal.set(false); }
  closeForfaitsModal() { this.showForfaitsModal.set(false); this.selectedForfait.set(null); }

  selectForfait(forfait: Forfait) {
    this.selectedForfaitForPayment.set(forfait);
    this.closeForfaitsModal();
    this.showPaymentModal.set(true);
  }

  // ── Payment success ───────────────────────────────────────
  onPaymentSuccess(data: any) {
    console.log('Payment success:', data);
    this.showPaymentModal.set(false);
    // TODO: API call to create subscription with data.orderId
    alert(`✅ Paiement réussi!\n\nOrder ID: ${data.orderId}\nMontant: ${data.amount} TND\nMéthode: ${data.method}\n\nVotre abonnement sera activé dans quelques instants.`);
    this.loadAbonnement();
  }

  // ── Navigation ────────────────────────────────────────────
  navigateTo(path: string) { this.router.navigate([path]); }

  // ── Actions ───────────────────────────────────────────────
  demanderProlongation() {
    console.log('Demander prolongation de 10 jours');
    // TODO: API call
    this.closeWarningModal();
    alert('✅ Demande de prolongation envoyée!\n\nVous recevrez une confirmation par email sous 24h.');
  }

  telechargerFacture() {
    console.log('Télécharger facture');
    // TODO: API call to generate and download PDF
    alert('📥 Téléchargement de la facture en cours...');
  }

  logout() {
    console.log('Déconnexion');
    // TODO: Implement logout
    alert('👋 Déconnexion...');
  }

  isExpiringSoon = isAbonnementExpiringSoon;
}