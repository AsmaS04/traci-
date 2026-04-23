import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { NotificationWebsocketService } from '../../../service/notification-websocket.service';
import { Reseller } from '../../../models/reseller.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reseller-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './reseller-layout.html',
  styleUrl: './reseller-layout.css',
})
export default class ResellerLayout implements OnInit, OnDestroy {

  private resellerService = inject(ResellerService);
  private wsService       = inject(NotificationWebsocketService);
  private router          = inject(Router);
  public  i18n            = inject(TranslationService);

  collapsed  = false;
  darkMode   = false;
  notifOpen  = false;
  notifCount = 0;
  avatarOpen = false;

  reseller: Reseller = {
    idRev: 0, username: '', email: '', nomEntreprise: 'TRACI',
    deviceCostByDay: 0, daysCount: 0, phone: '', clientCount: 0, createdAt: '',
  };

  notifications: { text: string; time: string }[] = [];

  private wsSub?: Subscription;

  get initials(): string {
    const name = this.reseller.username || this.reseller.nomEntreprise || 'R';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit() {
    // Load real profile from backend — survives refresh
    this.resellerService.getMyProfile().subscribe({
      next: (r: Reseller) => { this.reseller = r; },
      error: (err) => {
        // Fallback to localStorage values set during login
        const username = localStorage.getItem('username') ?? 'Reseller';
        const email    = localStorage.getItem('email') ?? '';
        this.reseller = { ...this.reseller, username, email };
        console.error('Failed to load reseller profile', err);
      }
    });

    // WebSocket notifications
    this.wsSub = this.wsService.notification$.subscribe(notif => {
      const text = notif.type === 'NEW_CLIENT'
        ? `New client added: ${notif.message}`
        : `Payment received: ${notif.message}`;
      this.notifications.unshift({ text, time: 'just now' });
      this.notifCount++;
    });
  }

  ngOnDestroy() {
    this.wsSub?.unsubscribe();
  }

  toggleCollapse(): void { this.collapsed = !this.collapsed; }
  toggleDark(): void     { this.darkMode = !this.darkMode; document.documentElement.classList.toggle('dark', this.darkMode); }
  toggleNotif(): void    { this.notifOpen = !this.notifOpen; this.avatarOpen = false; if (this.notifOpen) this.notifCount = 0; }
  closeNotif(): void     { this.notifOpen = false; }
  toggleAvatar(): void   { this.avatarOpen = !this.avatarOpen; this.notifOpen = false; }
  closeAvatar(): void    { this.avatarOpen = false; }
  async toggleLang(): Promise<void> { await this.i18n.toggle(); }
  get lang(): string { return this.i18n.lang(); }

  goToProfile(): void { this.avatarOpen = false; this.router.navigate(['/reseller-dashboard/profile']); }
  openSupport(): void { this.avatarOpen = false; alert('Support: contact@traci.tn'); }
  logout(): void {
    this.avatarOpen = false;
    localStorage.clear();
    this.router.navigate(['/bo-reseller-access']);
  }

  navItems = [
    {
      labelKey: 'nav_dashboard',
      route: '/reseller-dashboard/dashboard',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`
    },
    {
      labelKey: 'nav_clients',
      route: '/reseller-dashboard/clients',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    },
    {
      labelKey: 'nav_devices',
      route: '/reseller-dashboard/devices',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>`
    },
    {
      labelKey: 'nav_profile',
      route: '/reseller-dashboard/profile',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    },
  ];
}