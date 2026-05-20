import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../service/translation.service';
import { NotificationWebsocketService, AppNotification, AvatarEvent } from '../../service/notification-websocket.service';
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
  avatarUrl?: string;
}

interface UiNotification {
  id?: number;
  icon: 'client' | 'reseller' | 'device' | 'receipt' | 'cpu';
  text: string;
  time: string;
  isRead: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, OnDestroy {

  @Input() brandKey          = 'topbar_panel';
  @Input() showSearch        = false;
  @Input() showSupport       = false;
  @Input() showNotifications = true;
  @Input() showHamburger     = false;
  @Input() notifPortal: 'admin' | 'reseller' | 'client' = 'admin';

  @Input()  searchResults: NavbarSearchItem[] = [];
  @Output() search         = new EventEmitter<string>();
  @Output() searchNavigate = new EventEmitter<NavbarSearchItem>();

  @Input()  isDark = false;
  @Output() darkToggle = new EventEmitter<void>();

  @Input() navbarUser: NavbarUser = { name: 'User', email: '' };

  @Output() profileClick   = new EventEmitter<void>();
  @Output() logoutClick    = new EventEmitter<void>();
  @Output() supportClick   = new EventEmitter<void>();
  @Output() hamburgerClick = new EventEmitter<void>();

  readonly i18n            = inject(TranslationService);
  private readonly notifWs = inject(NotificationWebsocketService);
  private readonly http    = inject(HttpClient);

  private readonly notifApiUrl        = 'http://localhost:8080/api/notifications';
  private readonly ADMIN_SEEN_AT_KEY  = 'admin_notif_seen_at';
  private readonly RESELLER_NOTIF_KEY = 'reseller_notif_history';
  private readonly CLIENT_NOTIF_KEY   = 'client_notif_history';

  @ViewChild('searchInput') searchInputEl?: ElementRef<HTMLInputElement>;

  notifOpen      = false;
  notifCount     = 0;
  avatarOpen     = false;
  searchQuery    = '';
  searchOpen     = false;
  searchExpanded = false;

  notifications: UiNotification[] = [];
  private notifSub!: Subscription;
  private avatarSub!: Subscription;

  avatarUrl = signal<string | null>(null);

  get initials(): string {
    return this.navbarUser.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  }

  ngOnInit(): void {
    if (!this.showNotifications) return;

    if (this.notifPortal === 'admin') {
      this.loadAdminNotifications();
      this.notifWs.connect();
      this.notifSub = this.notifWs.notification$.subscribe((n: AppNotification) => {
        this.handleIncomingNotification(n);
      });
    } else if (this.notifPortal === 'reseller') {
      this.loadResellerNotifications();
      this.notifWs.connect();
      this.notifSub = this.notifWs.resellerNotification$.subscribe((n: AppNotification) => {
        this.handleIncomingNotification(n);
      });
      this.avatarSub = this.notifWs.avatar$.subscribe((event: AvatarEvent) => {
        if (event.avatarUrl) {
          this.avatarUrl.set(event.avatarUrl.startsWith('http')
            ? event.avatarUrl : 'http://localhost:8080' + event.avatarUrl);
        }
      });
    } else if (this.notifPortal === 'client') {
      this.loadClientNotifications();
      this.notifWs.connect();
      this.notifSub = this.notifWs.clientNotification$.subscribe((n: AppNotification) => {
        this.handleIncomingNotification(n);
      });
    }
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    this.avatarSub?.unsubscribe();
  }

  private handleIncomingNotification(n: AppNotification): void {
    const type = n.type as string;

    if (this.notifPortal === 'admin') {
      const excluded = ['DEVICE_REQUEST_FULFILLED', 'DEVICE_REQUEST_REJECTED', 'COMMISSION_EARNED'];
      if (excluded.includes(type)) return;
    }

    if (this.notifPortal === 'reseller') {
      const allowed = ['DEVICE_REQUEST_FULFILLED', 'DEVICE_REQUEST_REJECTED', 'COMMISSION_EARNED'];
      if (!allowed.includes(type)) return;
    }

    if (this.notifPortal === 'client') {
      const allowed = ['PAYMENT_SUCCESS', 'SUBSCRIPTION_EXPIRING', 'DEVICE_ASSIGNED', 'RESELLER_REASSIGNED'];
      if (!allowed.includes(type)) return;
    }

    const mapped = this.mapNotification(n);
    this.notifications.unshift(mapped);
    this.notifCount++;

    if (this.notifPortal === 'reseller') this.saveToLocalStorage(this.RESELLER_NOTIF_KEY, mapped);
    if (this.notifPortal === 'client')   this.saveToLocalStorage(this.CLIENT_NOTIF_KEY,   mapped);
  }

  private loadAdminNotifications(): void {
    this.http.get<any[]>(this.notifApiUrl).subscribe({
      next: (list) => {
        const seenAt   = localStorage.getItem(this.ADMIN_SEEN_AT_KEY);
        const seenDate = seenAt ? new Date(seenAt) : null;
        const filtered = list.filter(n => !['COMMISSION_EARNED'].includes(n.type));
        this.notifications = filtered.map(n => ({
          id:     n.id,
          icon:   this.iconFromType(n.type),
          text:   n.detail ?? n.label ?? n.type,
          time:   this.formatStoredTime(n.createdAt),
          isRead: seenDate ? new Date(n.createdAt) <= seenDate : false,
        }));
        this.notifCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: () => {}
    });
  }

  private loadResellerNotifications(): void {
    this.loadFromLocalStorage(this.RESELLER_NOTIF_KEY);
  }

  private loadClientNotifications(): void {
    this.loadFromLocalStorage(this.CLIENT_NOTIF_KEY);
  }

  private loadFromLocalStorage(key: string): void {
    try {
      const raw = localStorage.getItem(key);
      this.notifications = raw ? JSON.parse(raw) : [];
      this.notifCount    = this.notifications.filter(n => !n.isRead).length;
    } catch {
      this.notifications = [];
      this.notifCount    = 0;
    }
  }

  private saveToLocalStorage(key: string, n: UiNotification): void {
    try {
      const raw     = localStorage.getItem(key);
      const current: UiNotification[] = raw ? JSON.parse(raw) : [];
      current.unshift(n);
      if (current.length > 50) current.pop();
      localStorage.setItem(key, JSON.stringify(current));
    } catch {}
  }

  private saveAllToLocalStorage(key: string): void {
    try {
      localStorage.setItem(key, JSON.stringify(this.notifications));
    } catch {}
  }

  toggleNotif(): void {
    this.notifOpen = !this.notifOpen;

    if (this.notifOpen && this.notifCount > 0) {
      this.notifCount = 0;
      this.notifications.forEach(n => { n.isRead = true; });

      if (this.notifPortal === 'admin') {
        localStorage.setItem(this.ADMIN_SEEN_AT_KEY, new Date().toISOString());
      } else if (this.notifPortal === 'reseller') {
        this.saveAllToLocalStorage(this.RESELLER_NOTIF_KEY);
      } else if (this.notifPortal === 'client') {
        this.saveAllToLocalStorage(this.CLIENT_NOTIF_KEY);
      }
    }
  }

  private mapNotification(n: AppNotification): UiNotification {
    const t      = n.type as string;
    const detail = (n as any).detail ?? (n as any).message ?? (n as any).label ?? '';

    if (this.notifPortal === 'reseller') {
      if (t === 'COMMISSION_EARNED') {
        const match  = detail.match(/[\d.,]+ TND/);
        const amount = match ? match[0] : '';
        return { icon: 'receipt', text: amount ? `✨ Commission earned: ${amount}` : `✨ ${detail}`, time: 'just now', isRead: false };
      }
      if (t === 'DEVICE_REQUEST_FULFILLED') return { icon: 'device',  text: `Devices assigned: ${detail}`, time: 'just now', isRead: false };
      if (t === 'DEVICE_REQUEST_REJECTED')  return { icon: 'device',  text: `Request rejected: ${detail}`, time: 'just now', isRead: false };
      return { icon: 'device', text: detail, time: 'just now', isRead: false };
    }

    if (this.notifPortal === 'client') {
      if (t === 'PAYMENT_SUCCESS')       return { icon: 'receipt',  text: detail, time: 'just now', isRead: false };
      if (t === 'DEVICE_ASSIGNED')       return { icon: 'cpu',      text: detail, time: 'just now', isRead: false };
      if (t === 'SUBSCRIPTION_EXPIRING') return { icon: 'receipt',  text: detail, time: 'just now', isRead: false };
      if (t === 'RESELLER_REASSIGNED')   return { icon: 'reseller', text: detail, time: 'just now', isRead: false };
      return { icon: 'cpu', text: detail, time: 'just now', isRead: false };
    }

    // Admin
    const icon = this.iconFromType(t);
    const text =
      t === 'NEW_CLIENT'         ? `${this.i18n.t('act_client_added')}: ${detail}`    :
      t === 'NEW_RESELLER'       ? `New reseller: ${detail}`                           :
      t === 'NEW_DEVICE_REQUEST' ? `Device request: ${detail}`                         :
      t === 'DEVICE_ASSIGNED'    ? `Device assigned: ${detail}`                        :
      t === 'NEW_PAYMENT'        ? `${this.i18n.t('act_payment_received')}: ${detail}` :
      detail;
    return { icon, text, time: 'just now', isRead: false };
  }

  private iconFromType(type: string): UiNotification['icon'] {
    if (type.includes('CLIENT'))  return 'client';
    if (type.includes('DEVICE'))  return 'device';
    if (type.includes('PAYMENT')) return 'receipt';
    return 'reseller';
  }

  private formatStoredTime(createdAt: string): string {
    if (!createdAt) return '—';
    try {
      const date = new Date(createdAt);
      const diff = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diff < 1)  return 'just now';
      if (diff < 60) return `${diff}m ago`;
      const h = Math.floor(diff / 60);
      if (h < 24)    return `${h}h ago`;
      return date.toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' });
    } catch { return '—'; }
  }

  onSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) { this.searchOpen = false; return; }
    this.searchOpen = true;
    this.search.emit(q);
  }

  onNavigate(r: NavbarSearchItem): void {
    this.searchQuery = ''; this.searchOpen = false;
    this.searchNavigate.emit(r);
  }

  closeSearch(): void  { setTimeout(() => { this.searchOpen = false; }, 180); }

  toggleMobileSearch(): void {
    this.searchExpanded = !this.searchExpanded;
    if (this.searchExpanded) {
      setTimeout(() => this.searchInputEl?.nativeElement.focus(), 60);
    } else {
      this.searchQuery = '';
      this.searchOpen  = false;
    }
  }

  closeMobileSearch(): void {
    this.searchExpanded = false;
    this.searchQuery    = '';
    this.searchOpen     = false;
  }

  closeNotif(): void   { this.notifOpen = false; }
  toggleAvatar(): void { this.avatarOpen = !this.avatarOpen; this.notifOpen = false; }

  onDarkToggle(): void  { this.darkToggle.emit(); }
  onProfile(): void     { this.avatarOpen = false; this.profileClick.emit(); }
  onLogout(): void      { this.avatarOpen = false; this.logoutClick.emit(); }
  onSupport(): void     { this.avatarOpen = false; this.supportClick.emit(); }
  onHamburger(): void   { this.hamburgerClick.emit(); }

  async toggleLang(): Promise<void> { await this.i18n.toggle(); }
  get lang(): string { return this.i18n.lang(); }
}