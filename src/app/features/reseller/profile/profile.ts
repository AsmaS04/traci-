import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { Reseller } from '../../../models/reseller.model';

type TabName = 'profile' | 'security' | 'notifications' | 'activity' | 'preferences';

@Component({
  selector: 'app-reseller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export default class ResellerProfileComponent implements OnInit {

  constructor(
    public i18n: TranslationService,
    private router: Router,
    private resellerService: ResellerService
  ) {}

  reseller: Reseller = {
    idRev: 0, username: '', email: '', nomEntreprise: '',
    deviceCostByDay: 0, daysCount: 0, phone: '', clientCount: 0, createdAt: '',
  };

  ngOnInit() {
    this.resellerService.getMyProfile().subscribe({
      next: (r: Reseller) => {
        this.reseller = r;
        this.profile = {
          username: r.username,
          nomEntreprise: r.nomEntreprise,
          email: r.email,
          phone: r.phone ?? '',
        };
      },
      error: (err: any) => console.error('Failed to load profile', err)
    });
  }

  // ── Tabs ──────────────────────────────────────────────
  activeTab: TabName = 'profile';
  switchTab(t: TabName) { this.activeTab = t; }

  // ── Profile form ──────────────────────────────────────
  profile = {
    username:       '',
    nomEntreprise:  '',
    email:          '',
    phone:          '',
  };

  // ── Avatar / photo upload ─────────────────────────────
  avatarPreview: string | null = null;
  avatarFile:    File | null   = null;
  uploadError    = '';

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) { this.uploadError = 'res_upload_type_error'; return; }
    if (file.size > 2 * 1024 * 1024)    { this.uploadError = 'res_upload_size_error'; return; }
    this.uploadError = '';
    this.avatarFile  = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    this.avatarFile    = null;
  }

  isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
  isValidPhone(p: string) { return /^\d{8}$/.test(p.replace(/[\s\-\.]/g, '')); }
  get profileEmailError() { return this.profile.email && !this.isValidEmail(this.profile.email) ? 'msg_error_invalid_email' : ''; }
  get profilePhoneError() { return this.profile.phone && !this.isValidPhone(this.profile.phone) ? 'msg_error_invalid_phone' : ''; }

  saveProfile() {
    if (!this.isValidEmail(this.profile.email) || !this.isValidPhone(this.profile.phone)) return;
    // TODO: call backend updateMyProfile
    console.log('Profile saved', this.profile);
  }

  // ── Security ──────────────────────────────────────────
  security = { currentPassword: '', newPassword: '', confirmPassword: '' };
  twoFaEnabled = false;

  get passwordStrength(): 'weak' | 'medium' | 'strong' {
    const p = this.security.newPassword;
    if (p.length === 0 || p.length < 8) return 'weak';
    if (p.length < 12) return 'medium';
    return 'strong';
  }
  get strengthWidth(): number {
    if (this.passwordStrength === 'strong') return 100;
    if (this.passwordStrength === 'medium') return 60;
    return this.security.newPassword.length ? 25 : 0;
  }

  updatePassword() {
    if (this.security.newPassword !== this.security.confirmPassword) return;
    this.security = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  sessions = [
    { device: 'Chrome — Windows 11', location: 'Tunis, Tunisia', lastActive: '5 minutes ago', current: true  },
    { device: 'Safari — iPhone 15',  location: 'Sfax, Tunisia',  lastActive: '2 hours ago',   current: false },
  ];
  revokeSession(index: number) { this.sessions.splice(index, 1); }

  // ── Notifications ─────────────────────────────────────
  notifications = [
    { nameKey: 'adm_notif_system_errors',  descKey: 'adm_notif_system_errors_desc',  enabled: true  },
    { nameKey: 'adm_notif_new_client',     descKey: 'adm_notif_new_client_desc',     enabled: true  },
    { nameKey: 'adm_notif_device_offline', descKey: 'adm_notif_device_offline_desc', enabled: true  },
    { nameKey: 'adm_notif_security',       descKey: 'adm_notif_security_desc',       enabled: true  },
    { nameKey: 'adm_notif_reports',        descKey: 'adm_notif_reports_desc',        enabled: false },
  ];

  // ── Preferences ───────────────────────────────────────
  preferences = { theme: 'light', language: 'en', timezone: 'GMT+1' };

  savePreferences() {
    this.i18n.loadTranslations(this.preferences.language as 'en' | 'fr');
  }

  // ── Activity ──────────────────────────────────────────
  readonly totalDevices      = 0;
  readonly activeDevices     = 0;
  readonly totalTransactions = 0;
  readonly totalRevenue      = 0;
  readonly totalClients      = 0;

  activityLog = [
    { icon: 'client', labelKey: 'act_client_added', entity: 'Client A',    date: '12 Mar 2026 · 09:41' },
    { icon: 'device', labelKey: 'res_add_device',   entity: 'Device #001', date: '11 Mar 2026 · 14:22' },
  ];

  dotClass(icon: string): string {
    if (icon === 'client') return 'tl-dot--teal';
    if (icon === 'device') return 'tl-dot--blue';
    return 'tl-dot--amber';
  }

  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  get initials(): string {
    return (this.reseller.username ?? 'R')
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  logout(): void { this.router.navigate(['/bo-reseller-access']); }
}