import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../service/translation.service';
import { NotificationWebsocketService, AppNotification } from '../../service/notification-websocket.service';
import { Subscription } from 'rxjs';

export interface NavbarSearchItem {
  type: 'client' | 'reseller' | 'device';
  id: number;
  title: string;
  subtitle: string;
  status: string;
  active: boolean;
  route: string;
}

export interface NavbarUser {
  name: string;
  email: string;
}

interface UiNotification {
  icon: 'client' | 'reseller' | 'device' | 'receipt' | 'cpu';
  text: string;
  time: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, OnDestroy {

  // ── Configuration ─────────────────────────────────────────
  @Input() brandKey          = 'topbar_panel';
  @Input() showSearch        = false;
  @Input() showSupport       = false;
  @Input() showNotifications = true;
  /** 'admin' | 'reseller' | 'client' — controls notification icon/text mapping */
  @Input() notifPortal: 'admin' | 'reseller' | 'client' = 'admin';

  // ── Search: results come IN from parent, query goes OUT ───
  @Input()  searchResults: NavbarSearchItem[] = [];
  @Output() search = new EventEmitter<string>();
  @Output() searchNavigate = new EventEmitter<NavbarSearchItem>();

  // ── Dark mode: state owned by parent ──────────────────────
  @Input()  isDark = false;
  @Output() darkToggle = new EventEmitter<void>();

  // ── Navbar user ───────────────────────────────────────────
  @Input() navbarUser: NavbarUser = { name: 'User', email: '' };

  // ── Action events ─────────────────────────────────────────
  @Output() profileClick = new EventEmitter<void>();
  @Output() logoutClick  = new EventEmitter<void>();
  @Output() supportClick = new EventEmitter<void>();

  readonly i18n            = inject(TranslationService);
  private readonly notifWs = inject(NotificationWebsocketService);

  notifOpen  = false;
  notifCount = 0;
  avatarOpen = false;
  searchQuery  = '';
  searchOpen   = false;

  notifications: UiNotification[] = [];
  private notifSub!: Subscription;

  get initials(): string {
    return this.navbarUser.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  }

  ngOnInit(): void {
    if (!this.showNotifications) return;
    this.notifWs.connect();
    this.notifSub = this.notifWs.notification$.subscribe((n: AppNotification) => {
      this.notifications.unshift(this.mapNotification(n));
      this.notifCount++;
    });
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    if (this.showNotifications) this.notifWs.disconnect();
  }

  private mapNotification(n: AppNotification): UiNotification {
    const t = n.type as string;
    const detail = n.detail ?? n.message ?? n.label ?? '';

    // ── Client portal notifications ────────────────────────
    if (this.notifPortal === 'client') {
      if (t === 'SUBSCRIPTION_EXPIRING') {
        return { icon: 'receipt', text: `${this.i18n.t('notif_sub_expiring')}: ${detail}`, time: 'just now' };
      }
      if (t === 'DEVICE_ASSIGNED') {
        return { icon: 'cpu', text: `${this.i18n.t('notif_device_assigned')}: ${detail}`, time: 'just now' };
      }
      return { icon: 'cpu', text: detail, time: 'just now' };
    }

    // ── Admin / Reseller notifications ─────────────────────
    const icon: UiNotification['icon'] = t.includes('CLIENT') ? 'client' : t.includes('DEVICE') ? 'device' : 'reseller';
    const text = t === 'NEW_CLIENT'
      ? `${this.i18n.t('act_client_added')}: ${detail}`
      : `${this.i18n.t('act_payment_received')}: ${detail}`;
    return { icon, text, time: 'just now' };
  }

  // ── Search ────────────────────────────────────────────────
  onSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) { this.searchOpen = false; return; }
    this.searchOpen = true;
    this.search.emit(q);                  // parent handles API call
  }

  onNavigate(r: NavbarSearchItem): void {
    this.searchQuery = ''; this.searchOpen = false;
    this.searchNavigate.emit(r);
  }

  closeSearch(): void   { setTimeout(() => { this.searchOpen = false; }, 180); }
  toggleNotif(): void   { this.notifOpen = !this.notifOpen; if (this.notifOpen) this.notifCount = 0; }
  closeNotif(): void    { this.notifOpen = false; }
  toggleAvatar(): void  { this.avatarOpen = !this.avatarOpen; this.notifOpen = false; }

  onDarkToggle(): void { this.darkToggle.emit(); }
  onProfile(): void    { this.avatarOpen = false; this.profileClick.emit(); }
  onLogout(): void     { this.avatarOpen = false; this.logoutClick.emit(); }
  onSupport(): void    { this.avatarOpen = false; this.supportClick.emit(); }

  async toggleLang(): Promise<void> { await this.i18n.toggle(); }
  get lang(): string { return this.i18n.lang(); }
}