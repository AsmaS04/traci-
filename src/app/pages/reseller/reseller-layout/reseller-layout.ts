import { Component, OnInit, computed, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ThemeService } from '../../../service/theme.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { DeviceService } from '../../../service/Device.service';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { SidebarComponent, SidebarEntry, SidebarUser } from '../../../shared/sidebar/sidebar';
import { NavbarComponent, NavbarSearchItem, NavbarUser } from '../../../shared/navbar/navbar';
import { Reseller } from '../../../models/reseller.model';
import { forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, Subject, switchMap } from 'rxjs';
import { NotificationWebsocketService, AvatarEvent } from '../../../service/notification-websocket.service';  // <-- import AvatarEvent

@Component({
  selector: 'app-reseller-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastComponent],
  templateUrl: './reseller-layout.html',
  styleUrl: './reseller-layout.css',
})
export default class ResellerLayout implements OnInit {

  private readonly resellerService     = inject(ResellerService);
  private readonly clientService       = inject(ClientService);
  private readonly deviceService       = inject(DeviceService);
  private readonly router              = inject(Router);
  private readonly i18n                = inject(TranslationService);
  private readonly themeService        = inject(ThemeService);
  private readonly notificationService = inject(NotificationWebsocketService);

  sidebarOpen = signal(false);

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeSidebar():  void { this.sidebarOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeSidebar(); }

  get isDark(): boolean { return this.themeService.currentTheme() === 'dark'; }
  onDarkToggle(): void  { this.themeService.toggleTheme(); }

  reseller: Reseller = {
    idRev: 0, username: '', email: '', nomEntreprise: 'TRACI',
    deviceCostByDay: 0, daysCount: 0, phone: '', clientCount: 0, createdAt: '',
    avatarUrl: '',   // <-- add this field (ensure your Reseller model interface includes it)
  };

  navItems = computed<SidebarEntry[]>(() => {
    void this.i18n.lang();
    return [
      { label: this.i18n.t('nav_dashboard'), route: '/reseller-dashboard/dashboard', icon: 'dashboard', exactMatch: true },
      { label: this.i18n.t('nav_clients'),   route: '/reseller-dashboard/clients',   icon: 'users' },
      { label: this.i18n.t('nav_devices'),   route: '/reseller-dashboard/devices',   icon: 'cpu' },
      { divider: true },
      { label: this.i18n.t('nav_profile'),   route: '/reseller-dashboard/profile',   icon: 'user' },
    ];
  });

  // Sidebar user with avatarUrl
  get sidebarUser(): SidebarUser {
    return {
      name: this.reseller.username || 'Reseller',
      email: this.reseller.email,
      avatarUrl: this.reseller.avatarUrl ? this.buildFullUrl(this.reseller.avatarUrl) : undefined,
      status: 'online'
    };
  }

  // Navbar user with avatarUrl
  get navbarUser(): NavbarUser {
    return {
      name: this.reseller.username || 'Reseller',
      email: this.reseller.email,
      avatarUrl: this.reseller.avatarUrl ? this.buildFullUrl(this.reseller.avatarUrl) : undefined
    };
  }

  private buildFullUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : 'http://localhost:8080' + url;
  }

  searchResults: NavbarSearchItem[] = [];
  private searchQuery$ = new Subject<string>();

  constructor() {
    this.searchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.fetchSearchResults(q)),
    ).subscribe(results => { this.searchResults = results; });
  }

  onSearch(query: string): void {
    if (!query.trim()) { this.searchResults = []; return; }
    this.searchQuery$.next(query.trim().toLowerCase());
  }

  onSearchNavigate(item: NavbarSearchItem): void {
    this.router.navigate([item.route.split('?')[0]], {
      queryParams: item.route.includes('?id=')
        ? { id: item.route.split('?id=')[1] }
        : {}
    });
  }

  private fetchSearchResults(q: string) {
    if (!this.reseller.idRev) return of([] as NavbarSearchItem[]);

    return forkJoin([
      this.clientService.getMyClients().pipe(catchError(() => of([]))),
      this.deviceService.getByReseller(this.reseller.idRev).pipe(catchError(() => of([]))),
    ]).pipe(
      map(([clients, devices]) => {
        const clientResults: NavbarSearchItem[] = clients
          .filter((c: any) =>
            `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(q) ||
            (c.email ?? '').toLowerCase().includes(q) ||
            (c.location ?? '').toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((c: any) => ({
            type:     'client' as const,
            id:       c.idClient,
            title:    `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email,
            subtitle: c.email,
            status:   (c.graceDaysLeft ?? 0) > 0 ? 'Active' : 'Inactive',
            active:   (c.graceDaysLeft ?? 0) > 0,
            route:    `/reseller-dashboard/clients?id=${c.idClient}`,
          }));

        const deviceResults: NavbarSearchItem[] = devices
          .filter((d: any) =>
            String(d.idDevice ?? '').includes(q) ||
            (d.serialNumber ?? '').toLowerCase().includes(q) ||
            (d.model ?? '').toLowerCase().includes(q)
          )
          .slice(0, 3)
          .map((d: any) => ({
            type:     'device' as const,
            id:       d.idDevice,
            title:    `Device #${d.idDevice}`,
            subtitle: d.serialNumber ?? d.model ?? '',
            status:   d.status ?? 'Unknown',
            active:   (d.status ?? '').toLowerCase() === 'actif',
            route:    `/reseller-dashboard/devices`,
          }));

        return [...clientResults, ...deviceResults].slice(0, 8);
      })
    );
  }

 ngOnInit(): void {
  this.notificationService.connect(); // connect early (global channel)

  this.resellerService.getMyProfile().subscribe({
    next: (r: Reseller) => {
      this.reseller = { ...r, avatarUrl: r.avatarUrl ?? '' };
      if (this.reseller.idRev) {
        localStorage.setItem('idRev', this.reseller.idRev.toString());
        // Subscribe to reseller-specific topics now that we have the ID
        this.notificationService.subscribeToReseller(this.reseller.idRev);
      }

      this.notificationService.avatar$.subscribe((event: AvatarEvent) => {
        if (event.avatarUrl && this.reseller.idRev === event.resellerId) {
          const fullUrl = event.avatarUrl.startsWith('http')
            ? event.avatarUrl
            : 'http://localhost:8080' + event.avatarUrl;
          this.reseller = { ...this.reseller, avatarUrl: fullUrl };
        }
      });
    },
    error: () => {
      this.reseller.username = localStorage.getItem('username') ?? 'Reseller';
      this.reseller.email    = localStorage.getItem('email') ?? '';
    },
  });
}

  goToProfile(): void { this.router.navigate(['/reseller-dashboard/profile']); }
  openSupport(): void { alert('Support: contact@traci.tn'); }
  logout():      void { localStorage.clear(); this.router.navigate(['/bo-reseller-access']); }
}