import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  @Input() notifPortal: 'admin' | 'reseller' | 'client' = 'admin';

  @Input()  searchResults: NavbarSearchItem[] = [];
  @Output() search         = new EventEmitter<string>();
  @Output() searchNavigate = new EventEmitter<NavbarSearchItem>();

  @Input()  isDark = false;
  @Output() darkToggle = new EventEmitter<void>();

  @Input() navbarUser: NavbarUser = { name: 'User', email: '' };

  @Output() profileClick = new EventEmitter<void>();
  @Output() logoutClick  = new EventEmitter<void>();
  @Output() supportClick = new EventEmitter<void>();

  readonly i18n            = inject(TranslationService);
  private readonly notifWs = inject(NotificationWebsocketService);
  private readonly http    = inject(HttpClient);

  private readonly notifApiUrl      = 'http://localhost:8080/api/notifications';
  private readonly RESELLER_NOTIF_KEY = 'reseller_notif_history';

  notifOpen   = false;
  notifCount  = 0;
  avatarOpen  = false;
  searchQuery = '';
  searchOpen  = false;

  notifications: UiNotification[] = [];
  private notifSub!: Subscription;

  get initials(): string {
    return this.navbarUser.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  }

  ngOnInit(): void {
    if (!this.showNotifications) return;

    // Load existing notifications from storage (reseller) or DB (admin)
    if (this.notifPortal === 'admin') {
      this.loadAdminNotifications();
    } else if (this.notifPortal === 'reseller') {
      this.loadResellerNotifications();
    }


    this.notifWs.connect();


    if (this.notifPortal === 'reseller') {
      // Reseller private channel (for commission, device requests, etc.)
      this.notifSub = this.notifWs.resellerNotification$.subscribe((n: AppNotification) => {
        this.handleIncomingNotification(n);
      });
    } else if (this.notifPortal === 'admin') {
      // Global admin channel
      this.notifSub = this.notifWs.notification$.subscribe((n: AppNotification) => {
        this.handleIncomingNotification(n);
      });
    } else if (this.notifPortal === 'client') {
      // Client channel 
      this.notifSub = this.notifWs.notification$.subscribe((n: AppNotification) => {
        this.handleIncomingNotification(n);
      });
    }
  }

  private handleIncomingNotification(n: AppNotification): void {
    const type = n.type as string;

    // Filter based on portal
    if (this.notifPortal === 'admin') {
      const excluded = ['DEVICE_REQUEST_FULFILLED', 'DEVICE_REQUEST_REJECTED'];
      if (excluded.includes(type)) return;
    }

    if (this.notifPortal === 'reseller') {
      const allowed = ['DEVICE_REQUEST_FULFILLED', 'DEVICE_REQUEST_REJECTED', 'COMMISSION_EARNED'];
      if (!allowed.includes(type)) return;
    }

    if (this.notifPortal === 'client') {
      const allowed = [
        'SUBSCRIPTION_EXPIRING', 'DEVICE_ASSIGNED',
        'DEVICE_REQUEST_FULFILLED', 'DEVICE_REQUEST_REJECTED'
      ];
      if (!allowed.includes(type)) return;
    }

    const mapped = this.mapNotification(n);
    this.notifications.unshift(mapped);
    this.notifCount++;

    if (this.notifPortal === 'reseller') {
      this.saveToLocalStorage(mapped);
    }
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    
  }

  // ── Admin: load from DB ───────────────────────────────
  private loadAdminNotifications(): void {
    this.http.get<any[]>(this.notifApiUrl).subscribe({
      next: (list) => {
        this.notifications = list.map(n => ({
          id:     n.id,
          icon:   this.iconFromType(n.type),
          text:   n.detail ?? n.label ?? n.type,
          time:   this.formatStoredTime(n.createdAt),
          isRead: n.isRead ?? false,
        }));
        this.notifCount = list.filter(n => !n.isRead).length;
      },
      error: () => {}
    });
  }

  // ── Reseller: load/save from localStorage ─────────────
  private loadResellerNotifications(): void {
    try {
      const raw = localStorage.getItem(this.RESELLER_NOTIF_KEY);
      this.notifications = raw ? JSON.parse(raw) : [];
      this.notifCount = this.notifications.filter(n => !n.isRead).length;
    } catch {
      this.notifications = [];
      this.notifCount = 0;
    }
  }

  private saveToLocalStorage(n: UiNotification): void {
    try {
      const current: UiNotification[] = (() => {
        const raw = localStorage.getItem(this.RESELLER_NOTIF_KEY);
        return raw ? JSON.parse(raw) : [];
      })();
      current.unshift(n);
      if (current.length > 50) current.pop();
      localStorage.setItem(this.RESELLER_NOTIF_KEY, JSON.stringify(current));
    } catch {}
  }

  // ── Toggle bell — mark all as read on open ────────────
  toggleNotif(): void {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen && this.notifCount > 0) {
      this.notifCount = 0;
      this.notifications.forEach(n => { n.isRead = true; });

      if (this.notifPortal === 'admin') {
        this.notifications
          .filter(n => n.id != null)
          .forEach(n => {
            this.http.put(`${this.notifApiUrl}/${n.id}/read`, {}).subscribe({ error: () => {} });
          });
      } else if (this.notifPortal === 'reseller') {
        try {
          localStorage.setItem(this.RESELLER_NOTIF_KEY, JSON.stringify(this.notifications));
        } catch {}
      }
    }
  }

  // ── Map WebSocket notification to UI ─────────────────
  private mapNotification(n: AppNotification): UiNotification {
    const t      = n.type as string;
    const detail = (n as any).detail ?? (n as any).message ?? (n as any).label ?? '';

    if (this.notifPortal === 'reseller') {
      if (t === 'COMMISSION_EARNED') {
        let amount = '';
        const match = detail.match(/[\d.,]+ TND/);
        if (match) amount = match[0];
        const text = amount ? `✨ Commission earned: ${amount}` : `✨ New commission: ${detail}`;
        return { icon: 'receipt', text, time: 'just now', isRead: false };
      }
      if (t === 'DEVICE_REQUEST_FULFILLED') {
        return { icon: 'device', text: `Devices assigned: ${detail}`, time: 'just now', isRead: false };
      }
      if (t === 'DEVICE_REQUEST_REJECTED') {
        return { icon: 'device', text: `Request rejected: ${detail}`, time: 'just now', isRead: false };
      }
      return { icon: 'device', text: detail, time: 'just now', isRead: false };
    }

    if (this.notifPortal === 'client') {
      if (t === 'SUBSCRIPTION_EXPIRING')    return { icon: 'receipt', text: `${this.i18n.t('notif_sub_expiring')}: ${detail}`,   time: 'just now', isRead: false };
      if (t === 'DEVICE_ASSIGNED')          return { icon: 'cpu',     text: `${this.i18n.t('notif_device_assigned')}: ${detail}`, time: 'just now', isRead: false };
      if (t === 'DEVICE_REQUEST_FULFILLED') return { icon: 'cpu',     text: `Devices ready: ${detail}`,                           time: 'just now', isRead: false };
      if (t === 'DEVICE_REQUEST_REJECTED')  return { icon: 'cpu',     text: `Request rejected: ${detail}`,                        time: 'just now', isRead: false };
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

  // ── Search ────────────────────────────────────────────
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
  closeNotif(): void   { this.notifOpen = false; }
  toggleAvatar(): void { this.avatarOpen = !this.avatarOpen; this.notifOpen = false; }

  onDarkToggle(): void { this.darkToggle.emit(); }
  onProfile(): void    { this.avatarOpen = false; this.profileClick.emit(); }
  onLogout(): void     { this.avatarOpen = false; this.logoutClick.emit(); }
  onSupport(): void    { this.avatarOpen = false; this.supportClick.emit(); }

  async toggleLang(): Promise<void> { await this.i18n.toggle(); }
  get lang(): string { return this.i18n.lang(); }
}