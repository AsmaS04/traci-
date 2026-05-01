import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { AuthService } from '../../../service/Auth.service';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { SidebarComponent, SidebarEntry, SidebarUser } from '../../../shared/sidebar/sidebar';
import { NavbarComponent, NavbarUser } from '../../../shared/navbar/navbar';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, ToastComponent],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css',
})
export default class ClientLayoutComponent implements OnInit {

  private readonly i18n        = inject(TranslationService);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  isDark = false;
  onDarkToggle(): void { this.isDark = !this.isDark; document.documentElement.classList.toggle('dark', this.isDark); }

  private username = '';
  private email    = '';

  // ── Sidebar ──────────────────────────────────────────────
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
    return { name: this.username || 'Client', email: this.email, status: 'online' };
  }

  get navbarUser(): NavbarUser {
    return { name: this.username || 'Client', email: this.email };
  }

  ngOnInit(): void {
    this.username = this.authService.getUsername() ?? 'Client';
    this.email    = this.authService.getEmail()    ?? '';
  }

  goToProfile(): void { this.router.navigate(['/client-dashboard/profil']); }
  logout():      void { this.authService.logout(); }
}