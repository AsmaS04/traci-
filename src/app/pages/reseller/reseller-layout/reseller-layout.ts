import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { SidebarComponent, SidebarEntry, SidebarUser } from '../../../shared/sidebar/sidebar';
import { NavbarComponent, NavbarSearchItem, NavbarUser } from '../../../shared/navbar/navbar';
import { Reseller } from '../../../models/reseller.model';
// import { ClientService } from '../../../service/client.service';
// import { DeviceService } from '../../../service/device.service';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-reseller-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastComponent],
  templateUrl: './reseller-layout.html',
  styleUrl: './reseller-layout.css',
})
export default class ResellerLayout implements OnInit {

  private readonly resellerService = inject(ResellerService);
  private readonly router          = inject(Router);
  private readonly i18n            = inject(TranslationService);

  // Inject when ready:
  // private readonly clientService = inject(ClientService);
  // private readonly deviceService = inject(DeviceService);

  isDark = false;
  onDarkToggle(): void { this.isDark = !this.isDark; document.documentElement.classList.toggle('dark', this.isDark); }

  reseller: Reseller = {
    idRev: 0, username: '', email: '', nomEntreprise: 'TRACI',
    deviceCostByDay: 0, daysCount: 0, phone: '', clientCount: 0, createdAt: '',
  };

  // ── Sidebar ──────────────────────────────────────────────
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

  get sidebarUser(): SidebarUser {
    return { name: this.reseller.username || 'Reseller', email: this.reseller.email, status: 'online' };
  }

  get navbarUser(): NavbarUser {
    return { name: this.reseller.username || 'Reseller', email: this.reseller.email };
  }

  // ── Live search ───────────────────────────────────────────
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
    this.router.navigate([item.route]);
  }

  /**
   * Replace with real service calls when ready. Same pattern as admin:
   *
   *   return forkJoin([
   *     this.clientService.getMyClients().pipe(catchError(() => of([]))),
   *     this.deviceService.getMyDevices().pipe(catchError(() => of([]))),
   *   ]).pipe(
   *     map(([clients, devices]) => [
   *       ...clients.filter(c => c.username.toLowerCase().includes(q)).slice(0, 4)
   *         .map(c => ({ type: 'client' as const, id: c.id, title: c.username,
   *                      subtitle: c.email, status: 'Active', active: true,
   *                      route: '/reseller-dashboard/clients' })),
   *       ...devices.filter(d => String(d.id).includes(q)).slice(0, 3)
   *         .map(d => ({ type: 'device' as const, id: d.id, title: `Device #${d.id}`,
   *                      subtitle: d.status, status: d.status,
   *                      active: d.status === 'actif',
   *                      route: '/reseller-dashboard/devices' })),
   *     ])
   *   );
   */
  private fetchSearchResults(q: string) {
    // ── Temporary: replace once real services are connected ──
    return of([] as NavbarSearchItem[]);
    // ────────────────────────────────────────────────────────
  }

  ngOnInit(): void {
    this.resellerService.getMyProfile().subscribe({
      next:  (r: Reseller) => { this.reseller = r; },
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