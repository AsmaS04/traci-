import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ClientService, AbonnementDTO, PaiementDTO } from '../../../service/Client.service';
import { Device } from '../../../models/device.model';
import { Client } from '../../../models/client.model';
import { PaymentComponent } from '../payment/payment';

export interface RecentInvoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PaymentComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export default class DashboardComponent implements OnInit {

  i18n   = inject(TranslationService);
  router = inject(Router);
  private clientService = inject(ClientService);

  abonnement   = signal<AbonnementDTO | null>(null);
  isLoading    = signal(true);

  showWarningModal          = signal(false);
  showProfileDropdown       = signal(false);
  showForfaitsModal         = signal(false);
  showPaymentModal          = signal(false);
  selectedForfaitForPayment = signal<any>(null);

  user = { prenom: 'Client', nom: '', email: '' };
  clientDevices: Device[] = [];
  activeDevicesCount = 0;
  expiredDevicesCount = 0;
  recentInvoices: RecentInvoice[] = [];
  stats = { totalPaye: 0, nombreFactures: 0, support: '24/7' };

  forfaits = [
    { dureeMois: 3,  dureeLabel: '3 Mois', prix: 60,  prixUnitaire: 20, populaire: false, economie: 0 },
    { dureeMois: 6,  dureeLabel: '6 Mois', prix: 102, prixUnitaire: 17, populaire: true,  economie: 15 },
    { dureeMois: 12, dureeLabel: '1 An',    prix: 180, prixUnitaire: 15, populaire: false, economie: 25 },
  ];

  get daysLeft(): number {
    const abo = this.abonnement();
    return abo ? Math.max(0, abo.joursRestants) : 0;
  }

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

  get showExpiryBanner(): boolean { return this.daysLeft > 0 && this.daysLeft <= 15; }

  get contextualSubtitle(): string {
    const abo = this.abonnement();
    if (!abo) return this.i18n.t('dash_overview');
    if (this.daysLeft <= 0)  return this.i18n.t('dash_msg_expired');
    if (this.daysLeft < 7)   return this.i18n.t('dash_msg_critical').replace('{n}', String(this.daysLeft));
    if (this.daysLeft <= 15) return this.i18n.t('dash_msg_expiring').replace('{n}', String(this.daysLeft));
    const dateStr = new Date(abo.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return this.i18n.t('dash_msg_active').replace('{date}', dateStr);
  }

  get statusLabel(): 'active' | 'expiring' | 'expired' {
    if (this.daysLeft <= 0)  return 'expired';
    if (this.daysLeft <= 15) return 'expiring';
    return 'active';
  }

  get gracePeriodDays(): number { return 10; }

  getProgressPercentage(): number {
    const abo = this.abonnement();
    if (!abo) return 0;
    const debut = new Date(abo.startDate).getTime();
    const fin   = new Date(abo.endDate).getTime();
    return Math.min(100, Math.max(0, Math.round(((Date.now() - debut) / (fin - debut)) * 100)));
  }

  getProgressColor(): string { return this.getCountdownColor(); }

  invoiceStatusClass(s: string): string {
    if (s === 'paid')    return 'inv--paid';
    if (s === 'pending') return 'inv--pending';
    return 'inv--overdue';
  }

  ngOnInit() {
    this.isLoading.set(true);
    this.loadProfile();
    this.loadDevices();
    this.loadAbonnement();
    this.loadPayments();
  }

  private loadProfile() {
    this.clientService.getMyProfile().subscribe({
      next: (client: Client) => {
        this.user = { prenom: client.firstName ?? 'Client', nom: client.lastName ?? '', email: client.email ?? '' };
      },
      error: (err: any) => console.error('Failed to load profile', err)
    });
  }

  private loadDevices() {
    this.clientService.getMyDevices().subscribe({
      next: (devices: Device[]) => {
        this.clientDevices = devices;
        this.activeDevicesCount = devices.filter(d => ['active', 'attribué', 'actif'].includes((d.status ?? '').toLowerCase())).length;
        this.expiredDevicesCount = devices.filter(d => ['expired', 'inactif'].includes((d.status ?? '').toLowerCase())).length;
      },
      error: (err: any) => console.error('Failed to load devices', err)
    });
  }

  loadAbonnement() {
    this.clientService.getActiveAbonnement().subscribe({
      next: (abo: AbonnementDTO) => {
        this.abonnement.set(abo);
        this.isLoading.set(false);
        if (abo.joursRestants > 0 && abo.joursRestants <= 15) this.showWarningModal.set(true);
      },
      error: (err: any) => {
        console.error('No active abonnement or error', err);
        this.abonnement.set(null);
        this.isLoading.set(false);
      }
    });
  }

  private loadPayments() {
    this.clientService.getMyPayments().subscribe({
      next: (payments: PaiementDTO[]) => {
        this.recentInvoices = payments.slice(0, 3).map(p => ({
          id: p.payRef,
          date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          amount: p.amount ?? 0,
          status: (p.paymentStatus === 'completed' ? 'paid' : p.paymentStatus === 'pending' ? 'pending' : 'overdue') as 'paid' | 'pending' | 'overdue'
        }));
        const completed = payments.filter(p => p.paymentStatus === 'completed');
        this.stats = {
          totalPaye: completed.reduce((sum, p) => sum + (p.amount ?? 0), 0),
          nombreFactures: completed.length,
          support: '24/7'
        };
      },
      error: (err: any) => console.error('Failed to load payments', err)
    });
  }

  toggleProfileDropdown() { this.showProfileDropdown.set(!this.showProfileDropdown()); }
  closeProfileDropdown()  { this.showProfileDropdown.set(false); }
  closeWarningModal()     { this.showWarningModal.set(false); }
  openForfaitsModal()     { this.showForfaitsModal.set(true); this.showWarningModal.set(false); }
  closeForfaitsModal()    { this.showForfaitsModal.set(false); }

  selectForfait(forfait: any) {
    const nbDevices = this.clientDevices.length || 1;
    this.clientService.renewAbonnement(forfait.dureeMois, forfait.prixUnitaire, nbDevices).subscribe({
      next: (newAbo: AbonnementDTO) => {
        this.clientService.initPayment(newAbo.idAbo, newAbo.totalTtc).subscribe({
          next: (payment: PaiementDTO) => {
            this.closeForfaitsModal();
            this.selectedForfaitForPayment.set({ ...forfait, payRef: payment.payRef, aboId: newAbo.idAbo });
            this.showPaymentModal.set(true);
          },
          error: (err: any) => console.error('Failed to init payment', err)
        });
      },
      error: (err: any) => console.error('Failed to renew', err)
    });
  }

  onPaymentSuccess(data: any) {
    const forfait = this.selectedForfaitForPayment();
    if (forfait?.payRef) {
      this.clientService.confirmPayment(forfait.payRef, data.orderId ?? 'MANUAL').subscribe({
        next: () => {
          this.showPaymentModal.set(false);
          this.loadAbonnement();
          this.loadPayments();
          alert(`✅ Paiement réussi! Montant: ${data.amount} TND`);
        },
        error: (err: any) => console.error('Failed to confirm payment', err)
      });
    } else {
      this.showPaymentModal.set(false);
      this.loadAbonnement();
    }
  }

  navigateTo(path: string) { this.router.navigate([path]); }
  demanderProlongation() { this.closeWarningModal(); alert('✅ Demande de prolongation envoyée!'); }
  telechargerFacture() { alert('📥 Téléchargement de la facture en cours...'); }
  isExpiringSoon(days: number): boolean { return days > 0 && days <= 15; }

  getDeviceIcon(model: string): string {
    if ((model ?? '').includes('BOX')) return '📦';
    if ((model ?? '').includes('MINI')) return '📱';
    if ((model ?? '').includes('PRO')) return '💼';
    if ((model ?? '').includes('LITE')) return '⚡';
    return '📡';
  }
}