import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {

  collapsed  = false;
  darkMode   = false;
  notifOpen  = false;
  notifCount = 3;

  constructor(public i18n: TranslationService) {}

  toggleSidebar(): void { this.collapsed = !this.collapsed; }

  toggleDark(): void {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle('dark', this.darkMode);
  }
  toggleNotif(): void   { this.notifOpen = !this.notifOpen; if (this.notifOpen) this.notifCount = 0; }
  closeNotif(): void    { this.notifOpen = false; }
  async toggleLang(): Promise<void> { await this.i18n.toggle(); }

  get lang(): string    { return this.i18n.lang(); }

  notifications = [
    { icon: 'reseller', textKey: 'act_reseller_reg', sub: 'TechVision SARL', time: '2 min ago'  },
    { icon: 'client',   textKey: 'act_client_added', sub: 'Société Elyes',  time: '14 min ago' },
    { icon: 'device',   textKey: 'act_device_off',   sub: 'Device #4821',   time: '32 min ago' },
  ];

  navItems = [
    {
      labelKey: 'nav_dashboard',
      route: '/admin/dashboard',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`
    },
    {
      labelKey: 'nav_resellers',
      route: '/admin/resellers',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    },
    {
      labelKey: 'nav_clients',
      route: '/admin/clients',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    },
    {
      labelKey: 'nav_devices',
      route: '/admin/devices',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>`
    },
  ];
}