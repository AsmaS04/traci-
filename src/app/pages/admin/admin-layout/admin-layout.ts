import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { NotificationWebsocketService, AppNotification } from '../../../service/notification-websocket.service';
import { Subscription } from 'rxjs';

interface SearchResult {
  type: 'client' | 'reseller' | 'device';
  id: number;
  title: string;
  subtitle: string;
  status: string;
  active: boolean;
  route: string;
}

interface UiNotification {
  icon: 'client' | 'reseller' | 'device';
  textKey: string;
  sub: string;
  time: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout implements OnInit, OnDestroy {

  collapsed  = false;
  darkMode   = false;
  notifOpen  = false;
  notifCount = 0;
  avatarOpen = false;

  searchQuery   = '';
  searchOpen    = false;
  searchResults: SearchResult[] = [];

  notifications: UiNotification[] = [];

  private notifSub!: Subscription;

  constructor(
    public i18n: TranslationService,
    private router: Router,
    private notifWs: NotificationWebsocketService
  ) {}

  ngOnInit() {
    this.notifWs.connect();
    this.notifSub = this.notifWs.notification$.subscribe((n: AppNotification) => {
      const ui: UiNotification = {
        icon: n.type === 'NEW_CLIENT' ? 'client' : 'reseller',
        textKey: n.type === 'NEW_CLIENT' ? 'act_client_added' : 'act_payment_received',
        sub: n.message,
        time: 'just now'
      };
      this.notifications.unshift(ui);
      this.notifCount++;
    });
  }

  ngOnDestroy() {
    this.notifSub?.unsubscribe();
    this.notifWs.disconnect();
  }

  private readonly allItems: SearchResult[] = [
    { type:'client',   id:1,  title:'Société Elyes',       subtitle:'TechVision SARL · Tunis',    status:'Active',   active:true,  route:'/admin/clients'   },
    { type:'client',   id:2,  title:'Transport Mrad',       subtitle:'NetPlus Solutions · Sfax',   status:'Active',   active:true,  route:'/admin/clients'   },
    { type:'reseller', id:1,  title:'TechVision SARL',      subtitle:'Khalil Mansour · Tunis',     status:'Active',   active:true,  route:'/admin/resellers' },
    { type:'device',   id:4821, title:'Device #4821',       subtitle:'Alpha Logistics · Tunis',    status:'Offline',  active:false, route:'/admin/clients'   },
  ];

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) { this.searchResults = []; this.searchOpen = false; return; }
    this.searchResults = this.allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      String(item.id).includes(q)
    ).slice(0, 6);
    this.searchOpen = true;
  }

  goToResult(r: SearchResult): void {
    this.searchQuery = ''; this.searchOpen = false; this.searchResults = [];
    this.router.navigate([r.route]);
  }

  closeSearch(): void { setTimeout(() => { this.searchOpen = false; }, 180); }

  toggleSidebar(): void { this.collapsed = !this.collapsed; }
  toggleDark(): void {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle('dark', this.darkMode);
  }
  toggleNotif(): void  { this.notifOpen = !this.notifOpen; if (this.notifOpen) this.notifCount = 0; }
  closeNotif(): void   { this.notifOpen = false; }
  toggleAvatar(): void { this.avatarOpen = !this.avatarOpen; this.notifOpen = false; }
  closeAvatar(): void  { this.avatarOpen = false; }
  goToProfile(): void  { this.avatarOpen = false; this.router.navigate(['/admin/profil']); }
  logout(): void       { this.avatarOpen = false; this.router.navigate(['/bo-admin-access']); }
  async toggleLang(): Promise<void> { await this.i18n.toggle(); }
  get lang(): string { return this.i18n.lang(); }

  navItems = [
    { labelKey:'nav_dashboard',    route:'/admin/dashboard',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
    { labelKey:'nav_resellers',    route:'/admin/resellers',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
    { labelKey:'nav_clients',      route:'/admin/clients',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    { labelKey:'nav_devices',      route:'/admin/devices',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>` },
    { labelKey:'nav_transactions', route:'/admin/transactions',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
    { labelKey:'nav_profile',      route:'/admin/profil',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
  ];
}