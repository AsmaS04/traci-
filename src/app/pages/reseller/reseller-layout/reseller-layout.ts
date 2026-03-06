import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { MOCK_RESELLER } from '../../../data/reseller-mock-data';

@Component({
  selector: 'app-reseller-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './reseller-layout.html',
  styleUrl: './reseller-layout.css',
})
export default class ResellerLayout {

  collapsed  = false;
  darkMode   = false;
  notifOpen  = false;
  notifCount = 3;

  reseller = MOCK_RESELLER;

  get initials(): string {
    return this.reseller.name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  constructor(public i18n: TranslationService) {}

  toggleCollapse(): void { this.collapsed = !this.collapsed; }
  toggleDark(): void     { this.darkMode = !this.darkMode; document.documentElement.classList.toggle('dark', this.darkMode); }
  toggleNotif(): void    { this.notifOpen = !this.notifOpen; if (this.notifOpen) this.notifCount = 0; }
  closeNotif(): void     { this.notifOpen = false; }
  async toggleLang(): Promise<void> { await this.i18n.toggle(); }

  get lang(): string { return this.i18n.lang(); }

  notifications = [
    { text: 'New client subscription',   time: '5 min ago'  },
    { text: 'Device #1032 went offline', time: '18 min ago' },
    { text: 'Invoice #84 paid',          time: '1 hr ago'   },
  ];

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
  ];
}