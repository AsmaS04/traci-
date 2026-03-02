// src/app/pages/client/client-layout/client-layout.ts

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ThemeService } from '../../../service/theme.service';
import { MOCK_USER } from '../../../data/mock-data';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css'
})
export default class ClientLayoutComponent implements OnInit {

  // Services
  i18n = inject(TranslationService);
  theme = inject(ThemeService);
  router = inject(Router);

  // Signals
  isSidebarOpen = signal(true);
  showProfileDropdown = signal(false);

  // User data
  user = MOCK_USER;

  ngOnInit() {
    // Initialize component
    this.checkMobileView();

    // Close sidebar on mobile by default
    if (window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  // Sidebar toggle
  toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  // Check if mobile view
  checkMobileView() {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        this.isSidebarOpen.set(false);
      } else {
        this.isSidebarOpen.set(true);
      }
    };

    window.addEventListener('resize', handleResize);
  }

  // Language toggle
  // Language toggle
toggleLanguage() {
  const currentLang = this.i18n.lang();
  const newLang = currentLang === 'fr' ? 'en' : 'fr';
 this.i18n.loadTranslations(newLang);
}

  // Theme toggle
  toggleTheme() {
    this.theme.toggleTheme();
  }

  // Profile dropdown
  toggleProfileDropdown() {
    this.showProfileDropdown.set(!this.showProfileDropdown());
  }

  closeProfileDropdown() {
    this.showProfileDropdown.set(false);
  }

  // Logout
  logout() {
    console.log('Déconnexion...');
    // TODO: Implémenter la déconnexion
    // Clear session, redirect to login, etc.
    this.router.navigate(['/login']);
  }
}
