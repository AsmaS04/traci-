import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { NotificationWebsocketService } from '../../../service/notification-websocket.service';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { Reseller } from '../../../models/reseller.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reseller-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, ToastComponent],
  templateUrl: './reseller-layout.html',
  styleUrl: './reseller-layout.css',
})
export default class ResellerLayout implements OnInit, OnDestroy {

  private resellerService = inject(ResellerService);
  private wsService       = inject(NotificationWebsocketService);
  private router          = inject(Router);
  public  i18n            = inject(TranslationService);

  darkMode   = false;
  notifOpen  = false;
  notifCount = 0;
  avatarOpen = false;

  notifications: { text: string; time: string }[] = [];

  reseller: Reseller = {
    idRev: 0, username: '', email: '', nomEntreprise: 'TRACI',
    deviceCostByDay: 0, daysCount: 0, phone: '', clientCount: 0, createdAt: '',
  };

  private wsSub?: Subscription;

  get initials(): string {
    const name = this.reseller.username || this.reseller.nomEntreprise || 'R';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  get lang(): string { return this.i18n.lang(); }

  ngOnInit() {
    this.resellerService.getMyProfile().subscribe({
      next: (r: Reseller) => { this.reseller = r; },
      error: () => {
        this.reseller.username = localStorage.getItem('username') ?? 'Reseller';
        this.reseller.email    = localStorage.getItem('email') ?? '';
      }
    });

    this.wsSub = this.wsService.notification$.subscribe(notif => {
      const text = notif.type === 'NEW_CLIENT'
        ? `New client: ${notif.message}`
        : `Payment received: ${notif.message}`;
      this.notifications.unshift({ text, time: 'just now' });
      this.notifCount++;
    });
  }

  ngOnDestroy() { this.wsSub?.unsubscribe(); }

  async toggleLang(): Promise<void> { await this.i18n.toggle(); }
  toggleDark():  void { this.darkMode  = !this.darkMode; document.documentElement.classList.toggle('dark', this.darkMode); }
  toggleNotif(): void { this.notifOpen = !this.notifOpen; this.avatarOpen = false; if (this.notifOpen) this.notifCount = 0; }
  toggleAvatar():void { this.avatarOpen = !this.avatarOpen; this.notifOpen = false; }

  goToProfile(): void { this.avatarOpen = false; this.router.navigate(['/reseller-dashboard/profile']); }
  openSupport(): void { this.avatarOpen = false; alert('Support: contact@traci.tn'); }
  logout():      void { this.avatarOpen = false; localStorage.clear(); this.router.navigate(['/bo-reseller-access']); }
}