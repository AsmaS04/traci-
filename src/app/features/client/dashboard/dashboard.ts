import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ClientService, AbonnementDTO, PaiementDTO } from '../../../service/Client.service';
import { ToastService } from '../../../service/Toast.service';
import { Device } from '../../../models/device.model';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export default class DashboardComponent implements OnInit {

  i18n          = inject(TranslationService);
  router        = inject(Router);
  private clientService = inject(ClientService);
  private toast         = inject(ToastService);

  abonnement         = signal<AbonnementDTO | null>(null);
  isLoading          = signal(true);
  renewLoading       = signal(false);
  showExpiryOverlay  = signal(false);   // full-screen warning on open
  showForfaitsModal  = signal(false);
  showPaymentModal   = signal(false);
  selectedForfaitForPayment = signal<any>(null);

  user: { prenom: string; nom: string; email: string } = { prenom: 'Client', nom: '', email: '' };
  clientDevices: Device[] = [];

  forfaits = [
    { dureeMois: 3,  dureeLabel: '3 Months', prix: 60,  prixUnitaire: 20, populaire: false, economie: 0  },
    { dureeMois: 6,  dureeLabel: '6 Months', prix: 102, prixUnitaire: 17, populaire: true,  economie: 15 },
    { dureeMois: 12, dureeLabel: '1 Year',   prix: 180, prixUnitaire: 15, populaire: false, economie: 25 },
  ];

  // ── Computed ──────────────────────────────────────────
  get daysLeft(): number {
    const abo = this.abonnement();
    return abo ? Math.max(0, abo.joursRestants) : 0;
  }

  get totalDays(): number {
    const abo = this.abonnement();
    if (!abo) return 1;
    const start = new Date(abo.startDate).getTime();
    const end   = new Date(abo.endDate).getTime();
    return Math.max(1, Math.round((end - start) / 86400000));
  }

  get remainingPercent(): number {
    return Math.min(100, Math.max(0, Math.round((this.daysLeft / this.totalDays) * 100)));
  }

  get ringDashoffset(): number {
    return 282.74 * (1 - this.remainingPercent / 100);
  }

  // Progress bar / ring color: green → orange → red → deep red
  get progressColor(): string {
    if (this.daysLeft <= 0)                              return '#7f1d1d'; // deep red: expired
    if (this.daysLeft <= 7)                              return '#DC2626'; // red: critical
    if (this.daysLeft <= this.totalDays * 0.5)           return '#D97706'; // orange: half gone
    return '#0D9488';                                                       // green: healthy
  }

  get urgencyLevel(): 'safe' | 'warning' | 'danger' | 'expired' {
    if (!this.abonnement()) return 'expired';
    if (this.daysLeft <= 0)  return 'expired';
    if (this.daysLeft <= 7)  return 'danger';
    if (this.daysLeft <= 15) return 'warning';
    return 'safe';
  }

  get urgencyColor(): string {
    return { safe: '#0D9488', warning: '#D97706', danger: '#DC2626', expired: '#7f1d1d' }[this.urgencyLevel];
  }

  get urgencyBg(): string {
    return { safe: 'rgba(13,148,136,0.05)', warning: 'rgba(217,119,6,0.05)', danger: 'rgba(220,38,38,0.05)', expired: 'rgba(127,29,29,0.06)' }[this.urgencyLevel];
  }

  get progressPercent(): number {
    const abo = this.abonnement();
    if (!abo) return 100;
    const start = new Date(abo.startDate).getTime();
    const end   = new Date(abo.endDate).getTime();
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
  }

  get expiryDateStr(): string {
    const abo = this.abonnement();
    if (!abo) return '—';
    return new Date(abo.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get timeRemainingLabel(): string {
    if (this.daysLeft <= 0) return 'Expired';
    if (this.daysLeft < 30) return `${this.daysLeft} day${this.daysLeft === 1 ? '' : 's'}`;
    const months = Math.round(this.daysLeft / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  get planLabel(): string {
    const abo = this.abonnement();
    if (!abo) return 'No Plan';
    return abo.dureeLabel ?? `${abo.dureeMois} Month Plan`;
  }

  get statusChipLabel(): string {
    return { safe: 'ACTIVE', warning: 'EXPIRING SOON', danger: 'CRITICAL', expired: 'EXPIRED' }[this.urgencyLevel];
  }

  // Always show grace period button when not fully healthy
  get showGracePeriodButton(): boolean {
    return this.urgencyLevel !== 'safe';
  }

  get graceDaysLeft(): number {
    const abo = this.abonnement();
    return (abo as any)?.graceDaysLeft ?? 10;
  }

  get smartMessage(): { icon: 'ok' | 'warn'; title: string; body: string; level: 'ok' | 'warn' | 'danger' | 'expired' } {
    switch (this.urgencyLevel) {
      case 'safe':    return { icon: 'ok',   title: 'Everything is running smoothly',               body: 'No action required at the moment.',                          level: 'ok'      };
      case 'warning': return { icon: 'warn', title: `Subscription expires in ${this.daysLeft} days`, body: 'Plan ahead — renew before your service is interrupted.',     level: 'warn'    };
      case 'danger':  return { icon: 'warn', title: `⚠ Only ${this.daysLeft} days left`,            body: 'Your service will stop very soon. Renew immediately.',       level: 'danger'  };
      case 'expired': return { icon: 'warn', title: 'Your subscription has expired',                 body: 'Renew now to restore access to your devices.',              level: 'expired' };
    }
  }

  get activeDevicesCount(): number {
    return this.clientDevices.filter(d =>
['actif','active'].includes((d.status ?? '').toLowerCase())
    ).length;
  }

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit() {
    this.isLoading.set(true);
    this.clientService.getMyProfile().subscribe({
      next: (c: Client) => { this.user = { prenom: c.firstName ?? 'Client', nom: c.lastName ?? '', email: c.email ?? '' }; },
      error: () => {}
    });
    this.clientService.getMyDevices().subscribe({
      next: (d: Device[]) => { this.clientDevices = d; },
      error: () => {}
    });
    this.clientService.getActiveAbonnement().subscribe({
      next: (abo: AbonnementDTO) => {
        this.abonnement.set(abo);
        this.isLoading.set(false);
        // Show full-screen overlay if 7 days or fewer remain
        if (abo.joursRestants <= 7) {
          this.showExpiryOverlay.set(true);
        }
      },
      error: () => { this.abonnement.set(null); this.isLoading.set(false); }
    });
  }

  // ── Actions ───────────────────────────────────────────
  dismissOverlay()     { this.showExpiryOverlay.set(false); }
  openRenewModal()     { this.showForfaitsModal.set(true); this.showExpiryOverlay.set(false); }
  closeForfaitsModal() { this.showForfaitsModal.set(false); }

  activateGracePeriod() {
    this.toast.info(`Grace period gives you ${this.graceDaysLeft} extra days — activation coming soon.`);
  }

  selectForfait(f: any) {
    if (this.renewLoading()) return;
    this.renewLoading.set(true);
    const nbDevices = this.clientDevices.length || 1;
    this.clientService.renewAbonnement(f.dureeMois, f.prixUnitaire, nbDevices).subscribe({
      next: (newAbo: AbonnementDTO) => {
        this.clientService.initPayment(newAbo.idAbo, newAbo.totalTtc).subscribe({
          next: (payment: PaiementDTO) => {
            this.renewLoading.set(false);
            this.closeForfaitsModal();
            this.selectedForfaitForPayment.set({ ...f, payRef: payment.payRef, aboId: newAbo.idAbo });
            this.showPaymentModal.set(true);
            this.toast.success('Plan selected — complete payment to activate.');
          },
          error: () => { this.renewLoading.set(false); this.toast.error('Failed to initialise payment. Please try again.'); }
        });
      },
      error: () => { this.renewLoading.set(false); this.toast.error('Failed to renew subscription. Please try again.'); }
    });
  }

  navigateTo(p: string) { this.router.navigate([p]); }

  getDeviceIcon(model: string): string {
    const m = (model ?? '').toUpperCase();
    if (m.includes('BOX'))  return '📦';
    if (m.includes('MINI')) return '📱';
    if (m.includes('PRO'))  return '💼';
    if (m.includes('LITE')) return '⚡';
    return '📡';
  }
}