import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { NotificationWebsocketService } from '../../../service/notification-websocket.service';
import { Reseller } from '../../../models/reseller.model';
import { Subscription } from 'rxjs';

type TabName = 'profile'  | 'notifications' | 'activity';

@Component({
  selector: 'app-reseller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export default class ResellerProfileComponent implements OnInit, OnDestroy {

  private resellerService = inject(ResellerService);
  private clientService   = inject(ClientService);
  private wsService       = inject(NotificationWebsocketService);
  private router          = inject(Router);
  public  i18n            = inject(TranslationService);

  reseller: Reseller = {
    idRev: 0, username: '', email: '', nomEntreprise: '',
    deviceCostByDay: 0, daysCount: 0, phone: '', clientCount: 0,
    createdAt: '', avatarUrl: ''
  };

  profile = { username: '', nomEntreprise: '', email: '', phone: '' };

  // ── Avatar ────────────────────────────────────────────
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  uploadError = '';

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) { this.uploadError = 'adm_upload_type_error'; return; }
    if (file.size > 2 * 1024 * 1024)    { this.uploadError = 'adm_upload_size_error'; return; }
    this.uploadError = '';
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void { this.avatarPreview = null; this.avatarFile = null; }

  get initials(): string {
    return (this.reseller.username || 'R')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Tabs ──────────────────────────────────────────────
  activeTab: TabName = 'profile';
  switchTab(t: TabName) { this.activeTab = t; }

  // ── Stats ─────────────────────────────────────────────
  totalClients      = 0;
  totalDevices      = 0;
  activeDevices     = 0;
  totalRevenue      = 0;
  totalTransactions = 0;
  fmt(n: number) { return new Intl.NumberFormat().format(n); }

  // ── Validation ────────────────────────────────────────
  isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string) { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get profileEmailError() { return (this.profile.email && !this.isValidEmail(this.profile.email)) ? 'msg_error_invalid_email' : ''; }
  get profilePhoneError() { return (this.profile.phone && !this.isValidPhone(this.profile.phone)) ? 'msg_error_invalid_phone' : ''; }

  resetProfile() {
    this.profile = {
      username:      this.reseller.username,
      nomEntreprise: this.reseller.nomEntreprise,
      email:         this.reseller.email,
      phone:         this.reseller.phone ?? '',
    };
  }

  saveProfile() {
    if (this.profileEmailError || this.profilePhoneError) return;

    if (this.avatarFile) {
      this.resellerService.uploadAvatar(this.avatarFile).subscribe({
        next: (res: Reseller) => {
          this.reseller.avatarUrl = res.avatarUrl ?? '';
          this.avatarPreview = null;
          this.avatarFile = null;
        },
        error: () => { this.uploadError = 'adm_upload_size_error'; }
      });
    }

    this.resellerService.updateMyProfile(this.profile).subscribe({
      next: (updated: Reseller) => { this.reseller = { ...this.reseller, ...updated }; },
      error: (err) => console.error('Failed to update profile', err)
    });
  }



  // ── Notifications ─────────────────────────────────────
  notifSettings = [
    { nameKey: 'adm_notif_new_client',     descKey: 'adm_notif_new_client_desc',     enabled: true  },
    { nameKey: 'adm_notif_device_offline', descKey: 'adm_notif_device_offline_desc', enabled: true  },
    { nameKey: 'adm_notif_reports',        descKey: 'adm_notif_reports_desc',        enabled: false },
  ];

  // ── Activity ──────────────────────────────────────────
  activityLog: { icon: string; labelKey: string; entity: string; date: string }[] = [];

  // ── Lifecycle ─────────────────────────────────────────
  private avatarSub?: Subscription;

  ngOnInit() {
    this.resellerService.getMyProfile().subscribe({
      next: (r: Reseller) => {
        this.reseller = r;
        this.totalClients = r.clientCount ?? 0;
        this.profile = {
          username:      r.username,
          nomEntreprise: r.nomEntreprise,
          email:         r.email,
          phone:         r.phone ?? '',
        };
      },
      error: (err) => console.error('Failed to load profile', err)
    });

    this.clientService.getMyClients().subscribe({
      next: (clients) => { this.totalClients = clients.length; },
      error: () => {}
    });

    this.wsService.connect();
    this.avatarSub = this.wsService.avatar$.subscribe(event => {
      this.reseller.avatarUrl = event.avatarUrl;
      this.avatarPreview = null;
    });
  }

  ngOnDestroy() { this.avatarSub?.unsubscribe(); }

  logout(): void { localStorage.clear(); this.router.navigate(['/bo-reseller-access']); }
}