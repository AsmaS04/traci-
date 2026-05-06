import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { ResellerService } from '../../../service/Reseller.service';
import { DeviceService } from '../../../service/Device.service';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { SidebarComponent, SidebarEntry, SidebarUser } from '../../../shared/sidebar/sidebar';
import { NavbarComponent, NavbarSearchItem, NavbarUser } from '../../../shared/navbar/navbar';
import { forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {

  private readonly i18n            = inject(TranslationService);
  private readonly router          = inject(Router);
  private readonly clientService   = inject(ClientService);
  private readonly resellerService = inject(ResellerService);
  private readonly deviceService   = inject(DeviceService);

  isDark = false;
  onDarkToggle(): void { this.isDark = !this.isDark; document.documentElement.classList.toggle('dark', this.isDark); }

  navItems = computed<SidebarEntry[]>(() => {
    void this.i18n.lang();
    return [
      { label: this.i18n.t('nav_dashboard'),    route: '/admin/dashboard',    icon: 'dashboard', exactMatch: true },
      { label: this.i18n.t('nav_resellers'),    route: '/admin/resellers',    icon: 'building' },
      { label: this.i18n.t('nav_clients'),      route: '/admin/clients',      icon: 'users' },
      { label: this.i18n.t('nav_devices'),      route: '/admin/devices',      icon: 'cpu' },
      { label: this.i18n.t('nav_transactions'), route: '/admin/transactions', icon: 'card' },
      { divider: true },
      { label: this.i18n.t('nav_profile'),      route: '/admin/profil',       icon: 'user' },
    ];
  });

  sidebarUser: SidebarUser = { name: 'Admin', email: 'admin@traci.com', status: 'online' };
  navbarUser:  NavbarUser  = { name: 'Admin', email: 'admin@traci.com' };

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
    return forkJoin([
      this.clientService.getAll().pipe(catchError(() => of([]))),
      this.resellerService.getAll().pipe(catchError(() => of([]))),
      this.deviceService.getAll().pipe(catchError(() => of([]))),
    ]).pipe(
      map(([clients, resellers, devices]) => {
        const clientResults: NavbarSearchItem[] = clients
          .filter((c: any) =>
            `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(q) ||
            (c.email ?? '').toLowerCase().includes(q) ||
            (c.location ?? '').toLowerCase().includes(q)
          )
          .slice(0, 4)
          .map((c: any) => ({
            type:     'client' as const,
            id:       c.idClient,
            title:    `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email,
            subtitle: c.email,
            status:   (c.graceDaysLeft ?? 0) > 0 ? 'Active' : 'Inactive',
            active:   (c.graceDaysLeft ?? 0) > 0,
            route:    `/admin/clients?id=${c.idClient}`,
          }));

        const resellerResults: NavbarSearchItem[] = resellers
          .filter((r: any) =>
            (r.username ?? '').toLowerCase().includes(q) ||
            (r.nomEntreprise ?? '').toLowerCase().includes(q) ||
            (r.email ?? '').toLowerCase().includes(q)
          )
          .slice(0, 3)
          .map((r: any) => ({
            type:     'reseller' as const,
            id:       r.idRev,
            title:    r.nomEntreprise || r.username,
            subtitle: r.username,
            status:   'Active',
            active:   true,
            route:    `/admin/resellers?id=${r.idRev}`,
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
            route:    `/admin/devices`,
          }));

        return [...clientResults, ...resellerResults, ...deviceResults].slice(0, 8);
      })
    );
  }

  goToProfile(): void { this.router.navigate(['/admin/profil']); }
  logout():      void { this.router.navigate(['/bo-admin-access']); }
}