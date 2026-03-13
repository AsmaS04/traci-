import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';

interface SearchResult {
  type: 'client' | 'reseller' | 'device';
  id: number;
  title: string;
  subtitle: string;
  status: string;
  active: boolean;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {

  collapsed  = false;
  darkMode   = false;
  notifOpen  = false;
  notifCount = 3;
  avatarOpen = false;

  // ── Global Search ─────────────────────────────────────
  searchQuery  = '';
  searchOpen   = false;
  searchResults: SearchResult[] = [];

  private readonly allItems: SearchResult[] = [
    { type:'client',   id:1,  title:'Société Elyes',       subtitle:'TechVision SARL · Tunis',    status:'Active',   active:true,  route:'/admin/clients'   },
    { type:'client',   id:2,  title:'Transport Mrad',       subtitle:'NetPlus Solutions · Sfax',   status:'Active',   active:true,  route:'/admin/clients'   },
    { type:'client',   id:3,  title:'Alpha Logistics',      subtitle:'ConnectPro · Sousse',        status:'Active',   active:true,  route:'/admin/clients'   },
    { type:'client',   id:4,  title:'Ben Salem SARL',       subtitle:'Alpha Track · Bizerte',      status:'Inactive', active:false, route:'/admin/clients'   },
    { type:'client',   id:5,  title:'Ferchichi Transport',  subtitle:'GPS Tunisie · Nabeul',       status:'Active',   active:true,  route:'/admin/clients'   },
    { type:'client',   id:6,  title:'FleetCo Tunis',        subtitle:'FleetMaster TN · Tunis',     status:'Active',   active:true,  route:'/admin/clients'   },
    { type:'reseller', id:1,  title:'TechVision SARL',      subtitle:'Khalil Mansour · Tunis',     status:'Active',   active:true,  route:'/admin/resellers' },
    { type:'reseller', id:2,  title:'NetPlus Solutions',    subtitle:'Sana Trabelsi · Sfax',       status:'Active',   active:true,  route:'/admin/resellers' },
    { type:'reseller', id:3,  title:'ConnectPro Tunis',     subtitle:'Anis Belhaj · Sousse',       status:'Active',   active:true,  route:'/admin/resellers' },
    { type:'reseller', id:4,  title:'Alpha Track',          subtitle:'Rim Chaabane · Bizerte',     status:'Active',   active:true,  route:'/admin/resellers' },
    { type:'reseller', id:5,  title:'GPS Tunisie',          subtitle:'Yassine Ferchichi · Nabeul', status:'Active',   active:true,  route:'/admin/resellers' },
    { type:'device',   id:4821, title:'Device #4821',       subtitle:'Alpha Logistics · Tunis',    status:'Offline',  active:false, route:'/admin/clients'   },
    { type:'device',   id:3302, title:'Device #3302',       subtitle:'TechVision SARL · Tunis',    status:'Online',   active:true,  route:'/admin/clients'   },
    { type:'device',   id:2190, title:'Device #2190',       subtitle:'Société Elyes · Tunis',      status:'Offline',  active:false, route:'/admin/clients'   },
    { type:'device',   id:1032, title:'Device #1032',       subtitle:'FleetCo · Tunis',            status:'Online',   active:true,  route:'/admin/clients'   },
  ];

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) { this.searchResults = []; this.searchOpen = false; return; }
    this.searchResults = this.allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      String(item.id).includes(q)
    ).slice(0, 6);
    this.searchOpen = true;
  }

  goToResult(r: SearchResult): void {
    this.searchQuery  = '';
    this.searchOpen   = false;
    this.searchResults = [];
    this.router.navigate([r.route]);
  }

  closeSearch(): void {
    setTimeout(() => { this.searchOpen = false; }, 180);
  }

  constructor(public i18n: TranslationService, private router: Router) {}

  toggleSidebar(): void { this.collapsed = !this.collapsed; }
  toggleDark(): void {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle('dark', this.darkMode);
  }
  toggleNotif(): void { this.notifOpen = !this.notifOpen; if (this.notifOpen) this.notifCount = 0; }
  closeNotif(): void  { this.notifOpen = false; }
  toggleAvatar(): void { this.avatarOpen = !this.avatarOpen; this.notifOpen = false; }
  closeAvatar(): void  { this.avatarOpen = false; }
  goToProfile(): void  { this.avatarOpen = false; this.router.navigate(['/admin/profil']); }
  logout(): void       { this.avatarOpen = false; this.router.navigate(['/bo-admin-access']); }
  async toggleLang(): Promise<void> { await this.i18n.toggle(); }
  get lang(): string { return this.i18n.lang(); }

  notifications = [
    { icon: 'reseller', textKey: 'act_reseller_reg', sub: 'TechVision SARL', time: '2 min ago'  },
    { icon: 'client',   textKey: 'act_client_added', sub: 'Société Elyes',   time: '14 min ago' },
    { icon: 'device',   textKey: 'act_device_off',   sub: 'Device #4821',    time: '32 min ago' },
  ];

  navItems = [
    { labelKey:'nav_dashboard', route:'/admin/dashboard',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
    { labelKey:'nav_resellers', route:'/admin/resellers',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
    { labelKey:'nav_clients', route:'/admin/clients',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    { labelKey:'nav_devices', route:'/admin/devices',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>` },
    { labelKey:'nav_profile', route:'/admin/profil',
      icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
  ];
}