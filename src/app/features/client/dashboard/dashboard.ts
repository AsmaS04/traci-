import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../../service/translation.service';
import { ClientService, AbonnementDTO, FactureDTO } from '../../../service/Client.service';
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
  i18n            = inject(TranslationService);
  router          = inject(Router);
  private route   = inject(ActivatedRoute);
  private http    = inject(HttpClient);
  private clientService = inject(ClientService);
  private toast   = inject(ToastService);

  abonnement         = signal<AbonnementDTO | null>(null);
  clientProfile      = signal<Client | null>(null);
  isLoading          = signal(true);
  renewLoading       = signal(false);
  graceActivating    = signal(false);
  showExpiryOverlay  = signal(false);
  showForfaitsModal  = signal(false);
  showDeviceSelectModal = signal(false);
  currentClientId    = signal(0);
  plans              = signal<PlanOption[]>([]);
  plansLoading       = signal(false);
  hasEverPaid        = signal(false);
  currentPrixUnitaire = signal(0);
  invoices           = signal<FactureDTO[]>([]);
  invoicesLoading    = signal(false);

  selectedDeviceIds  = signal<Set<number>>(new Set());
  user: { prenom: string; nom: string; email: string } = { prenom: 'Client', nom: '', email: '' };
  clientDevices: Device[] = [];

  recentInvoices = computed(() =>
    [...this.invoices()]
      .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
      .slice(0, 4)
  );

  // ── Device selection helpers ─────────────────────────────────
  get selectedDeviceCount(): number { return this.selectedDeviceIds().size; }

  toggleDevice(idDevice: number): void {
    const current = new Set(this.selectedDeviceIds());
    if (current.has(idDevice)) current.delete(idDevice); else current.add(idDevice);
    this.selectedDeviceIds.set(current);
  }

  isDeviceSelected(idDevice: number): boolean { return this.selectedDeviceIds().has(idDevice); }
  getPlanTotal(plan: PlanOption): number { return this.selectedDeviceCount * plan.prixUnitaire * plan.dureeMois; }
  getDeviceDisplayName(d: Device): string { return d.customName || d.model || '—'; }

  // ── Grace period state ───────────────────────────────────────
  /** Grace period was activated and still has days remaining */
  get isGraceActive(): boolean {
    const p = this.clientProfile();
    return (p?.graceDaysUsed ?? 0) > 0 && (p?.graceDaysLeft ?? 0) > 0;
  }

  /** Grace was used but has fully expired — button shows "Used" */
  get graceAlreadyUsed(): boolean {
    const p = this.clientProfile();
    return (p?.graceDaysUsed ?? 0) > 0 && (p?.graceDaysLeft ?? 0) === 0;
  }

  get graceDaysRemaining(): number { return this.clientProfile()?.graceDaysLeft ?? 0; }

  /** Can click the activate button */
  get canActivateGrace(): boolean {
    return ['warning', 'danger', 'expired'].includes(this._rawSubscriptionState)
      && !this.graceAlreadyUsed
      && !this.isGraceActive;
  }

  // ── Subscription state ───────────────────────────────────────
  /** Raw state ignoring grace — used internally for canActivateGrace check */
  private get _rawSubscriptionState(): string {
    const abo = this.abonnement();
    if (!abo) return 'none';
    if (!this.hasEverPaid()) return 'pending';
    const raw = Math.max(0, abo.joursRestants);
    if (raw <= 0)  return 'expired';
    if (raw <= 7)  return 'danger';
    if (raw <= 15) return 'warning';
    return 'active';
  }

  get subscriptionState(): 'none' | 'pending' | 'active' | 'grace' | 'warning' | 'danger' | 'expired' {
    if (this.isGraceActive) return 'grace';
    return this._rawSubscriptionState as any;
  }

  // ── Derived display values ───────────────────────────────────
  get daysLeft(): number {
    if (this.isGraceActive) return this.graceDaysRemaining;
    const abo = this.abonnement();
    return abo ? Math.max(0, abo.joursRestants) : 0;
  }

  get totalDays(): number {
    if (this.isGraceActive) return 10;
    const abo = this.abonnement();
    if (!abo) return 1;
    return Math.max(1, Math.round(
      (new Date(abo.endDate).getTime() - new Date(abo.startDate).getTime()) / 86400000
    ));
  }

  get remainingPercent(): number { return Math.min(100, Math.max(0, Math.round((this.daysLeft / this.totalDays) * 100))); }
  get ringDashoffset(): number   { return 282.74 * (1 - this.remainingPercent / 100); }

  get progressPercent(): number {
    if (this.isGraceActive) return Math.round(((10 - this.graceDaysRemaining) / 10) * 100);
    const abo = this.abonnement();
    if (!abo) return 0;
    const start = new Date(abo.startDate).getTime();
    const end   = new Date(abo.endDate).getTime();
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
  }

  get progressColor(): string {
    const map: Record<string, string> = {
      none: '#9ca3af', pending: '#D97706', active: '#0D9488',
      grace: '#D97706', warning: '#D97706', danger: '#DC2626', expired: '#7f1d1d'
    };
    return map[this.subscriptionState];
  }

  get urgencyBg(): string {
    const map: Record<string, string> = {
      none: 'rgba(156,163,175,0.06)', pending: 'rgba(245,158,11,0.05)',
      active: 'rgba(13,148,136,0.05)', grace: 'rgba(217,119,6,0.05)',
      warning: 'rgba(217,119,6,0.05)', danger: 'rgba(220,38,38,0.05)',
      expired: 'rgba(127,29,29,0.06)'
    };
    return map[this.subscriptionState];
  }

  get expiryDateStr(): string {
    if (this.isGraceActive) {
      const activated = this.clientProfile()?.graceActivatedAt;
      if (activated) {
        const end = new Date(activated);
        end.setDate(end.getDate() + 10);
        return end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    const abo = this.abonnement();
    return abo
      ? new Date(abo.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
  }

  get timeRemainingLabel(): string {
    if (this.daysLeft <= 0) return 'Expired';
    if (this.daysLeft < 30) return `${this.daysLeft} day${this.daysLeft === 1 ? '' : 's'}`;
    const months = Math.round(this.daysLeft / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  get planLabel(): string {
    if (this.isGraceActive) return 'Grace Period Active';
    const abo = this.abonnement();
    return abo ? (abo.dureeLabel ?? `${abo.dureeMois} Month Plan`) : 'No Active Subscription';
  }

  get statusChipLabel(): string {
    const map: Record<string, string> = {
      none: 'NO PLAN', pending: 'PENDING PAYMENT', active: 'ACTIVE',
      grace: 'GRACE PERIOD', warning: 'EXPIRING SOON', danger: 'CRITICAL', expired: 'EXPIRED'
    };
    return map[this.subscriptionState];
  }

  get renewButtonLabel(): string {
    const s = this.subscriptionState;
    if (s === 'none' || s === 'pending') return 'Pay Now';
    if (s === 'expired') return 'Resubscribe';
    if (s === 'grace')   return 'Pay to Restore';
    return 'Renew Subscription';
  }

  get smartMessage(): { icon: 'ok' | 'warn'; title: string; body: string; level: 'ok' | 'warn' | 'danger' | 'expired' } {
    switch (this.subscriptionState) {
      case 'none':    return { icon: 'warn', level: 'expired', title: 'No active subscription',      body: 'Contact your reseller to get a device and start your service.' };
      case 'pending': return { icon: 'warn', level: 'warn',    title: 'Payment required to activate', body: 'Your device is assigned. Pay now to activate the tracking service.' };
      case 'active':  return { icon: 'ok',   level: 'ok',      title: 'Everything is running smoothly', body: 'No action required at the moment.' };
      case 'grace':   return { icon: 'warn', level: 'warn',    title: `Grace period — ${this.graceDaysRemaining} day${this.graceDaysRemaining === 1 ? '' : 's'} remaining`, body: 'Your service is temporarily extended. Pay now to avoid interruption when grace ends.' };
      case 'warning': return { icon: 'warn', level: 'warn',    title: `Subscription expires in ${this.daysLeft} days`, body: 'Plan ahead — renew before your service is interrupted.' };
      case 'danger':  return { icon: 'warn', level: 'danger',  title: `⚠ Only ${this.daysLeft} days left`, body: 'Your service will stop very soon. Renew immediately.' };
      case 'expired': return { icon: 'warn', level: 'expired', title: 'Your subscription has expired', body: 'Renew now to restore access to your devices.' };
    }
  }

  get activeDevicesCount(): number {
    return this.clientDevices.filter(d => ['actif', 'active'].includes((d.status ?? '').toLowerCase())).length;
  }

  // ── Lifecycle ────────────────────────────────────────────────
  ngOnInit() {
    this.isLoading.set(true);
    this.handleStripeReturn();
    this.loadInvoices();

    this.clientService.getMyProfile().subscribe({
      next: (c: Client) => {
        this.user = { prenom: c.firstName ?? 'Client', nom: c.lastName ?? '', email: c.email ?? '' };
        this.currentClientId.set(c.idClient);
        this.clientProfile.set(c);
      },
      error: () => {}
    });

    this.clientService.getMyDevices().subscribe({
      next: (d: Device[]) => { this.clientDevices = d; },
      error: () => {}
    });

    this.http.get<any[]>('http://localhost:8080/api/invoices/my').subscribe({
      next: (f) => this.hasEverPaid.set(f.length > 0),
      error: () => this.hasEverPaid.set(false)
    });

    this.clientService.getActiveAbonnement().subscribe({
      next: (abo: AbonnementDTO | null) => {
        this.abonnement.set(abo);
        this.isLoading.set(false);
        // Don't show expiry overlay if grace period is already active
        if (abo && abo.joursRestants <= 7 && this.hasEverPaid() && !this.isGraceActive) {
          this.showExpiryOverlay.set(true);
        }
      },
      error: () => { this.abonnement.set(null); this.isLoading.set(false); }
    });
  }

  private loadInvoices() {
    this.invoicesLoading.set(true);
    this.clientService.getMyFactures().subscribe({
      next: (data) => { this.invoices.set(data); this.invoicesLoading.set(false); },
      error: () => { this.invoices.set([]); this.invoicesLoading.set(false); }
    });
  }

  private handleStripeReturn() {
    const status = this.route.snapshot.queryParamMap.get('payment');
    if (status === 'success') {
      this.toast.success('Payment confirmed — subscription activated and invoice sent by email.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.hasEverPaid.set(true);
      // Refresh all data — payment during grace period clears grace state
      this.clientService.getMyProfile().subscribe({ next: (c) => this.clientProfile.set(c), error: () => {} });
      this.clientService.getActiveAbonnement().subscribe({ next: (abo) => this.abonnement.set(abo), error: () => {} });
      this.clientService.getMyDevices().subscribe({ next: (d) => { this.clientDevices = d; }, error: () => {} });
    } else if (status === 'cancelled') {
      this.toast.info('Payment cancelled.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  dismissOverlay() { this.showExpiryOverlay.set(false); }

  openRenewModal() {
    this.showExpiryOverlay.set(false);
    if (this.clientDevices.length === 0) {
      this.toast.info('Loading your devices, please wait…');
      this.clientService.getMyDevices().subscribe({
        next: (devices) => {
          this.clientDevices = devices;
          if (devices.length === 0) { this.toast.info('Contact your reseller to get a device first.'); return; }
          this.continueOpenRenewModal();
        },
        error: () => this.toast.error('Could not load devices. Please refresh the page.')
      });
      return;
    }
    this.continueOpenRenewModal();
  }

  private continueOpenRenewModal() {
    const preselected = new Set<number>(this.clientDevices.map(d => d.idDevice));
    this.selectedDeviceIds.set(preselected);
    const abo = this.abonnement();
    const plansUrl = abo
      ? `http://localhost:8080/api/payment/plans/${abo.idAbo}`
      : `http://localhost:8080/api/payment/plans-for-client/${this.currentClientId()}`;
    this.http.get<PlanOption[]>(plansUrl).subscribe({
      next: (p) => { this.plans.set(p); if (p.length > 0) this.currentPrixUnitaire.set(p[0].prixUnitaire); },
      error: () => this.toast.error('Could not load subscription plans.')
    });
    this.showDeviceSelectModal.set(true);
  }

  closeDeviceSelectModal() { this.showDeviceSelectModal.set(false); }

  confirmDeviceSelection() {
    if (this.selectedDeviceCount === 0) { this.toast.error('Please select at least one device.'); return; }
    this.showDeviceSelectModal.set(false);
    this.openPlansModal();
  }

  private openPlansModal() {
    if (this.plans().length > 0) { this.showForfaitsModal.set(true); return; }
    this.plansLoading.set(true);
    this.showForfaitsModal.set(true);
    const abo = this.abonnement();
    const plansUrl = abo
      ? `http://localhost:8080/api/payment/plans/${abo.idAbo}`
      : `http://localhost:8080/api/payment/plans-for-client/${this.currentClientId()}`;
    this.http.get<PlanOption[]>(plansUrl).subscribe({
      next: (p) => { this.plans.set(p); if (p.length > 0) this.currentPrixUnitaire.set(p[0].prixUnitaire); this.plansLoading.set(false); },
      error: () => { this.toast.error('Could not load plans.'); this.plansLoading.set(false); this.showForfaitsModal.set(false); }
    });
  }

  closeForfaitsModal() { this.showForfaitsModal.set(false); this.renewLoading.set(false); }

  async selectPlan(plan: PlanOption) {
    if (this.renewLoading()) return;
    const abo = this.abonnement();
    this.renewLoading.set(true);
    this.http.post<any>('http://localhost:8080/api/payment/initiate-renewal', {
      aboId: abo?.idAbo ?? 0,
      clientId: this.currentClientId(),
      dureeMois: plan.dureeMois,
      prixUnitaire: plan.prixUnitaire,
      selectedDeviceIds: Array.from(this.selectedDeviceIds())
    }).subscribe({
      next: async (response) => {
        const stripe = await loadStripe('pk_test_51TUmvOAdm9DoANgJsAktoNNpKzQS9sCyMzIA40UFj3CWYPjkC4UBA9Uj35QJJLaW53lc9qtxik41ZOqwE7kblfqy007Qqtj77m');
        if (!stripe) { this.renewLoading.set(false); return; }
        this.closeForfaitsModal();
        const result = await stripe.redirectToCheckout({ sessionId: response.sessionId });
        if (result.error) { this.toast.error('Stripe redirect failed.'); this.renewLoading.set(false); }
      },
      error: (err) => { this.toast.error('Failed to create payment session.'); this.renewLoading.set(false); }
    });
  }

  activateGracePeriod() {
    if (!this.canActivateGrace || this.graceActivating()) return;
    this.graceActivating.set(true);
    this.http.post<Client>('http://localhost:8080/api/client/grace-period/activate', {}).subscribe({
      next: (updatedClient) => {
        this.clientProfile.set(updatedClient);
        this.graceActivating.set(false);
        this.showExpiryOverlay.set(false);
        this.toast.success(`Grace period activated — ${updatedClient.graceDaysLeft} days added to your service`);
      },
      error: (err) => {
        this.graceActivating.set(false);
        this.toast.error(err?.error?.message || 'Could not activate grace period');
      }
    });
  }

  navigateTo(p: string) { this.router.navigate([p]); }
}