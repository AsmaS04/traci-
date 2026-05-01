import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { SidebarComponent, SidebarEntry, SidebarUser } from '../../../shared/sidebar/sidebar';
import { NavbarComponent, NavbarSearchItem, NavbarUser } from '../../../shared/navbar/navbar';
// ── Inject your real services here ────────────────────────────────────────────
// Replace these with whatever services expose getAll / search in your project.
// import { ClientService }  from '../../../service/client.service';
// import { ResellerService } from '../../../service/Reseller.service';
// import { DeviceService }  from '../../../service/device.service';
// ──────────────────────────────────────────────────────────────────────────────
import { forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {

  private readonly i18n   = inject(TranslationService);
  private readonly router = inject(Router);

  // Uncomment and inject your services when ready:
  // private readonly clientService  = inject(ClientService);
  // private readonly resellerService = inject(ResellerService);
  // private readonly deviceService  = inject(DeviceService);

  isDark = false;
  onDarkToggle(): void { this.isDark = !this.isDark; document.documentElement.classList.toggle('dark', this.isDark); }

  // ── Sidebar ──────────────────────────────────────────────
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

  // ── Live search ───────────────────────────────────────────
  searchResults: NavbarSearchItem[] = [];
  private searchQuery$ = new Subject<string>();

  constructor() {
    // Debounce so we don't fire on every keystroke
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
    this.router.navigate([item.route]);
  }

  /**
   * Replace the body of this method with real service calls.
   *
   * Example when your services are ready:
   *
   *   return forkJoin([
   *     this.clientService.getAll().pipe(catchError(() => of([]))),
   *     this.resellerService.getAll().pipe(catchError(() => of([]))),
   *     this.deviceService.getAll().pipe(catchError(() => of([]))),
   *   ]).pipe(
   *     map(([clients, resellers, devices]) => [
   *       ...clients
   *         .filter(c => c.username.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
   *         .slice(0, 3)
   *         .map(c => ({ type: 'client' as const, id: c.id, title: c.username,
   *                      subtitle: c.email, status: c.active ? 'Active' : 'Inactive',
   *                      active: c.active, route: '/admin/clients' })),
   *       ...resellers
   *         .filter(r => r.username.toLowerCase().includes(q))
   *         .slice(0, 2)
   *         .map(r => ({ type: 'reseller' as const, id: r.idRev, title: r.username,
   *                      subtitle: r.nomEntreprise, status: 'Active',
   *                      active: true, route: '/admin/resellers' })),
   *       ...devices
   *         .filter(d => String(d.id).includes(q) || d.imei?.includes(q))
   *         .slice(0, 2)
   *         .map(d => ({ type: 'device' as const, id: d.id, title: `Device #${d.id}`,
   *                      subtitle: d.clientName ?? '', status: d.status,
   *                      active: d.status === 'actif', route: '/admin/devices' })),
   *     ])
   *   );
   */
  private fetchSearchResults(q: string) {
    // ── Temporary: remove this block once real services are connected ──
    const mock: NavbarSearchItem[] = [
      { type: 'client',   id: 1,    title: 'Société Elyes',   subtitle: 'TechVision SARL · Tunis',  status: 'Active',  active: true,  route: '/admin/clients'   },
      { type: 'client',   id: 2,    title: 'Transport Mrad',  subtitle: 'NetPlus Solutions · Sfax', status: 'Active',  active: true,  route: '/admin/clients'   },
      { type: 'reseller', id: 1,    title: 'TechVision SARL', subtitle: 'Khalil Mansour · Tunis',   status: 'Active',  active: true,  route: '/admin/resellers' },
      { type: 'device',   id: 4821, title: 'Device #4821',    subtitle: 'Alpha Logistics · Tunis',  status: 'Offline', active: false, route: '/admin/devices'   },
    ];
    return of(
      mock.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q) ||
        String(i.id).includes(q)
      ).slice(0, 6)
    );
    // ── End temporary block ────────────────────────────────
  }

  goToProfile(): void { this.router.navigate(['/admin/profil']); }
  logout():      void { this.router.navigate(['/bo-admin-access']); }
}