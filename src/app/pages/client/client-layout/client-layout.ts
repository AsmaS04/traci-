import { Component, OnInit, computed, inject, OnDestroy, signal, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ThemeService } from '../../../service/theme.service';
import { AuthService } from '../../../service/Auth.service';
import { ClientService } from '../../../service/Client.service';
import { NotificationWebsocketService, AvatarEvent } from '../../../service/notification-websocket.service';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { SidebarComponent, SidebarEntry, SidebarUser } from '../../../shared/sidebar/sidebar';
import { NavbarComponent, NavbarUser } from '../../../shared/navbar/navbar';
import { Subscription } from 'rxjs';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastComponent],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css',
})
export default class ClientLayoutComponent implements OnInit, OnDestroy {

  private readonly i18n         = inject(TranslationService);
  private readonly authService  = inject(AuthService);
  private readonly router       = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly clientService = inject(ClientService);
  private readonly notificationService = inject(NotificationWebsocketService);

  private avatarSub!: Subscription;
  private clientId = 0;

  sidebarOpen = signal(false);
  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeSidebar():  void { this.sidebarOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeSidebar(); }

  get isDark(): boolean { return this.themeService.currentTheme() === 'dark'; }
  onDarkToggle(): void  { this.themeService.toggleTheme(); }

  private username = '';
  private email    = '';
  private avatarUrl = '';

  navItems = computed<SidebarEntry[]>(() => {
    void this.i18n.lang();
    return [
      { label: this.i18n.t('nav_dashboard'),     route: '/client-dashboard/dashboard',   icon: 'dashboard', exactMatch: true },
      { label: this.i18n.t('nav_subscriptions'), route: '/client-dashboard/abonnements', icon: 'file' },
      { label: this.i18n.t('nav_devices'),       route: '/client-dashboard/devices',     icon: 'cpu' },
      { label: this.i18n.t('nav_invoices'),      route: '/client-dashboard/factures',    icon: 'receipt' },
      { divider: true },
      { label: this.i18n.t('nav_profile'),       route: '/client-dashboard/profil',      icon: 'user' },
    ];
  });

  get sidebarUser(): SidebarUser {
    return {
      name: this.username || 'Client',
      email: this.email,
      avatarUrl: this.avatarUrl || undefined,
      status: 'online'
    };
  }

  get navbarUser(): NavbarUser {
    return {
      name: this.username || 'Client',
      email: this.email,
      avatarUrl: this.avatarUrl || undefined
    };
  }

  ngOnInit(): void {
    this.username = this.authService.getUsername() ?? 'Client';
    this.email    = this.authService.getEmail()    ?? '';

    // Load full profile (including avatar) from backend
    this.clientService.getMyProfile().subscribe({
      next: (client: Client) => {
        this.username = client.firstName ?? client.login ?? 'Client';
        this.email    = client.email ?? '';
        this.clientId = client.idClient;
        if (client.avatarUrl) {
          this.avatarUrl = client.avatarUrl.startsWith('http')
            ? client.avatarUrl
            : 'http://localhost:8080' + client.avatarUrl;
        }
        // Store clientId in localStorage for WebSocket subscription
        localStorage.setItem('clientId', this.clientId.toString());
        // Connect WebSocket after we have client ID
        this.notificationService.connect();
      },
      error: () => {
        this.username = this.authService.getUsername() ?? 'Client';
        this.email    = this.authService.getEmail()    ?? '';
      }
    });

    // Subscribe to client avatar updates
    this.avatarSub = this.notificationService.clientAvatar$.subscribe((event: AvatarEvent) => {
      if (event.avatarUrl && this.clientId === event.resellerId) {
        const fullUrl = event.avatarUrl.startsWith('http')
          ? event.avatarUrl
          : 'http://localhost:8080' + event.avatarUrl;
        this.avatarUrl = fullUrl;
      }
    });
  }

  ngOnDestroy(): void {
    this.avatarSub?.unsubscribe();
  }

  goToProfile(): void { this.router.navigate(['/client-dashboard/profil']); }
  logout():      void { this.authService.logout(); }
}