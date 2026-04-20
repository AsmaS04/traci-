import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ThemeService } from '../../../service/theme.service';
import { AuthService } from '../../../service/Auth.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css'
})
export default class ClientLayoutComponent implements OnInit {

  i18n = inject(TranslationService);
  theme = inject(ThemeService);
  router = inject(Router);
  private authService = inject(AuthService);

  isSidebarOpen = signal(true);
  showProfileDropdown = signal(false);

  user = {
    prenom: '',
    nom: '',
    email: '',
    avatar: '?',
    role: 'Client'
  };

  ngOnInit() {
    const username = this.authService.getUsername() ?? 'Client';
    const email = this.authService.getEmail() ?? '';
    this.user = {
      prenom: username,
      nom: '',
      email: email,
      avatar: (username[0] ?? 'C').toUpperCase(),
      role: 'Client'
    };
    this.checkMobileView();
    if (window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  toggleSidebar() { this.isSidebarOpen.set(!this.isSidebarOpen()); }

  checkMobileView() {
    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) this.isSidebarOpen.set(false);
      else this.isSidebarOpen.set(true);
    });
  }

  toggleLanguage() {
    const newLang = this.i18n.lang() === 'fr' ? 'en' : 'fr';
    this.i18n.loadTranslations(newLang);
  }

  toggleTheme() { this.theme.toggleTheme(); }
  toggleProfileDropdown() { this.showProfileDropdown.set(!this.showProfileDropdown()); }
  closeProfileDropdown() { this.showProfileDropdown.set(false); }

  logout() {
    this.authService.logout();
  }

  async setLanguage(lang: 'en' | 'fr') {
    if (this.i18n.lang() !== lang) await this.i18n.toggle();
  }
}