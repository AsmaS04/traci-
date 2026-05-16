import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../../service/translation.service';
import { ClientService, AbonnementDTO } from '../../../service/Client.service';
import { ToastService } from '../../../service/Toast.service';
import { Device } from '../../../models/device.model';
import { Client } from '../../../models/client.model';
import { loadStripe } from '@stripe/stripe-js';

export interface PlanOption {
  id: string;
  label: string;
  dureeMois: number;
  prixUnitaire: number;
  nbDevices: number;
  totalTtc: number;
  popular?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export default class DashboardComponent implements OnInit {

  i18n                  = inject(TranslationService);
  router                = inject(Router);
  private route         = inject(ActivatedRoute);
  private http          = inject(HttpClient);
  private clientService = inject(ClientService);
  private toast         = inject(ToastService);

  abonnement        = signal<AbonnementDTO | null>(null);
  isLoading         = signal(true);
  renewLoading      = signal(false);
  showExpiryOverlay = signal(false);
  showForfaitsModal = signal(false);
  currentClientId   = signal(0);
  plans             = signal<PlanOption[]>([]);
  plansLoading      = signal(false);
  hasEverPaid       = signal(false);

  user: { prenom: string; nom: string; email: string } = { prenom: 'Client', nom: '', email: '' };
  clientDevices: Device[] = [];

  // ── Single source of truth ────────────────────────────
  get subscriptionState(): 'none' | 'pending' | 'active' | 'warning' | 'danger' | 'expired' {
    const abo = this.abonnement();
    if (!abo)                return 'none';
    if (!this.hasEverPaid()) return 'pending';
    if (this.daysLeft <= 0)  return 'expired';
    if (this.daysLeft <= 7)  return 'danger';
    if (this.daysLeft <= 15) return 'warning';
    return 'active';
  }

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

  get progressPercent(): number {
    const abo = this.abonnement();
    if (!abo) return 0;
    const start = new Date(abo.startDate).getTime();
    const end   = new Date(abo.endDate).getTime();
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
  }

  get progressColor(): string {
    const map: Record<string, string> = {
      none:    '#9ca3af',
      pending: '#D97706',
      active:  '#0D9488',
      warning: '#D97706',
      danger:  '#DC2626',
      expired: '#7f1d1d'
    };
    return map[this.subscriptionState];
  }

  get urgencyBg(): string {
    const map: Record<string, string> = {
      none:    'rgba(156,163,175,0.06)',
      pending: 'rgba(245,158,11,0.05)',
      active:  'rgba(13,148,136,0.05)',
      warning: 'rgba(217,119,6,0.05)',
      danger:  'rgba(220,38,38,0.05)',
      expired: 'rgba(127,29,29,0.06)'
    };
    return map[this.subscriptionState];
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
    if (!abo) return 'No Active Subscription';
    return abo.dureeLabel ?? `${abo.dureeMois} Month Plan`;
  }

  get statusChipLabel(): string {
    const map: Record<string, string> = {
      none:    'NO PLAN',
      pending: 'PENDING PAYMENT',
      active:  'ACTIVE',
      warning: 'EXPIRING SOON',
      danger:  'CRITICAL',
      expired: 'EXPIRED'
    };
    return map[this.subscriptionState];
  }

  get renewButtonLabel(): string {
    const s = this.subscriptionState;
    if (s === 'none' || s === 'pending') return 'Pay Now';
    if (s === 'expired')                 return 'Resubscribe';
    return 'Renew Subscription';
  }

  get graceActive(): boolean {
    return this.subscriptionState === 'warning'
        || this.subscriptionState === 'danger'
        || this.subscriptionState === 'expired';
  }

  get graceDaysLeft(): number {
    const abo = this.abonnement();
    return (abo as any)?.graceDaysLeft ?? 10;
  }

  get smartMessage(): { icon: 'ok' | 'warn'; title: string; body: string; level: 'ok' | 'warn' | 'danger' | 'expired' } {
    switch (this.subscriptionState) {
      case 'none':    return { icon: 'warn', level: 'expired', title: 'No active subscription',            body: 'Contact your reseller to get a device and start your service.' };
      case 'pending': return { icon: 'warn', level: 'warn',    title: 'Payment required to activate',      body: 'Your device is assigned. Pay now to activate the tracking service.' };
      case 'active':  return { icon: 'ok',   level: 'ok',      title: 'Everything is running smoothly',    body: 'No action required at the moment.' };
      case 'warning': return { icon: 'warn', level: 'warn',    title: `Subscription expires in ${this.daysLeft} days`, body: 'Plan ahead — renew before your service is interrupted.' };
      case 'danger':  return { icon: 'warn', level: 'danger',  title: `⚠ Only ${this.daysLeft} days left`, body: 'Your service will stop very soon. Renew immediately.' };
      case 'expired': return { icon: 'warn', level: 'expired', title: 'Your subscription has expired',      body: 'Renew now to restore access to your devices.' };
    }
  }

  get activeDevicesCount(): number {
    return this.clientDevices.filter(d =>
      ['actif', 'active'].includes((d.status ?? '').toLowerCase())
    ).length;
  }

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit() {
    this.isLoading.set(true);
    this.loadClientId();
    this.handleStripeReturn();

    this.clientService.getMyProfile().subscribe({
      next: (c: Client) => {
        this.user = { prenom: c.firstName ?? 'Client', nom: c.lastName ?? '', email: c.email ?? '' };
      },
      error: () => {}
    });

    this.clientService.getMyDevices().subscribe({
      next: (d: Device[]) => { this.clientDevices = d; },
      error: () => {}
    });

    this.http.get<any[]>('http://localhost:8080/api/client/factures/my').subscribe({
      next: (f) => this.hasEverPaid.set(f.length > 0),
      error: () => this.hasEverPaid.set(false)
    });

    this.clientService.getActiveAbonnement().subscribe({
      next: (abo: AbonnementDTO) => {
        this.abonnement.set(abo);
        this.isLoading.set(false);
        if (abo.joursRestants <= 7 && this.hasEverPaid()) {
          this.showExpiryOverlay.set(true);
        }
      },
      error: () => { this.abonnement.set(null); this.isLoading.set(false); }
    });
  }

  private loadClientId() {
    this.http.get<any>('http://localhost:8080/api/clients/me').subscribe({
      next: (profile) => this.currentClientId.set(profile.id),
      error: () => console.error('Could not load client profile')
    });
  }

  private handleStripeReturn() {
    const status = this.route.snapshot.queryParamMap.get('payment');
    if (status === 'success') {
      this.toast.success('Payment confirmed — subscription activated and invoice sent by email.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.hasEverPaid.set(true);
      this.clientService.getActiveAbonnement().subscribe({
        next: (abo) => this.abonnement.set(abo),
        error: () => {}
      });
    } else if (status === 'cancelled') {
      this.toast.info('Payment cancelled.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  // ── Actions ───────────────────────────────────────────
  dismissOverlay() { this.showExpiryOverlay.set(false); }

  openRenewModal() {
    const abo = this.abonnement();
    this.showExpiryOverlay.set(false);

    if (!abo) {
      this.toast.info('Contact your reseller to set up your subscription first.');
      return;
    }

    if (this.currentClientId() === 0) {
      this.http.get<any>('http://localhost:8080/api/clients/me').subscribe({
        next: (profile) => {
          this.currentClientId.set(profile.id);
          this.loadPlansAndOpen(abo);
        },
        error: () => this.toast.error('Could not load client profile.')
      });
    } else {
      this.loadPlansAndOpen(abo);
    }
  }

  private loadPlansAndOpen(abo: AbonnementDTO) {
    this.plansLoading.set(true);
    this.showForfaitsModal.set(true);
    this.http.get<PlanOption[]>(`http://localhost:8080/api/payment/plans/${abo.idAbo}`).subscribe({
      next: (plans) => { this.plans.set(plans); this.plansLoading.set(false); },
      error: () => {
        this.toast.error('Could not load plans.');
        this.plansLoading.set(false);
        this.showForfaitsModal.set(false);
      }
    });
  }

  closeForfaitsModal() {
    this.showForfaitsModal.set(false);
    this.renewLoading.set(false);
  }

  async selectPlan(plan: PlanOption) {
    if (this.renewLoading()) return;
    const abo = this.abonnement();
    if (!abo) return;

    this.renewLoading.set(true);
    this.http.post<any>('http://localhost:8080/api/payment/initiate-renewal', {
      aboId:     abo.idAbo,
      clientId:  this.currentClientId(),
      dureeMois: plan.dureeMois
    }).subscribe({
      next: async (response) => {
        const stripe = await loadStripe('pk_test_51TUmvOAdm9DoANgJsAktoNNpKzQS9sCyMzIA40UFj3CWYPjkC4UBA9Uj35QJJLaW53lc9qtxik41ZOqwE7kblfqy007Qqtj77m');
        if (!stripe) { this.renewLoading.set(false); return; }
        this.closeForfaitsModal();
        const result = await stripe.redirectToCheckout({ sessionId: response.sessionId });
        if (result.error) {
          this.toast.error('Stripe redirect failed.');
          this.renewLoading.set(false);
        }
      },
      error: () => {
        this.toast.error('Failed to create payment session.');
        this.renewLoading.set(false);
      }
    });
  }

  activateGracePeriod() {
    if (!this.graceActive) return;
    this.toast.info(`Grace period gives you ${this.graceDaysLeft} extra days — activation coming soon.`);
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