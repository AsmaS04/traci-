import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { MOCK_RESELLER } from '../../../data/reseller-mock-data';
import { MOCK_DEVICES, MOCK_DEVICE_TRANSACTIONS } from '../../../data/device-mock-data';

type TabName = 'profile' | 'security' | 'notifications' | 'activity' | 'preferences';

@Component({
  selector: 'app-reseller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export default class ResellerProfileComponent {

  constructor(public i18n: TranslationService, private router: Router) {}

  readonly reseller = MOCK_RESELLER;

  // ── Tabs ──────────────────────────────────────────────
  activeTab: TabName = 'profile';
  switchTab(t: TabName) { this.activeTab = t; }

  // ── Profile form ──────────────────────────────────────
  profile = {
    name:        this.reseller.name,
    companyName: this.reseller.companyName,
    email:       this.reseller.email,
    phone:       this.reseller.phone,
    address:     this.reseller.address,
    region:      this.reseller.region,
  };

  // ── Avatar / photo upload ─────────────────────────────
  avatarPreview: string | null = (this.reseller as any).avatarUrl ?? null;
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
    reader.onload = (e) => {
      this.avatarPreview = e.target?.result as string;
      (this.reseller as any).avatarUrl = this.avatarPreview;
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    this.avatarFile    = null;
    (this.reseller as any).avatarUrl = null;
  }

  isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
  isValidPhone(p: string) { return /^\d{8}$/.test(p.replace(/[\s\-\.]/g, '')); }
  get profileEmailError() { return this.profile.email && !this.isValidEmail(this.profile.email) ? 'msg_error_invalid_email' : ''; }
  get profilePhoneError() { return this.profile.phone && !this.isValidPhone(this.profile.phone) ? 'msg_error_invalid_phone' : ''; }

  saveProfile() {
    if (!this.isValidEmail(this.profile.email) || !this.isValidPhone(this.profile.phone)) return;
    console.log('Profile saved', this.profile, 'Avatar:', this.avatarFile?.name);
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
  readonly totalDevices      = MOCK_DEVICES.length;
  readonly activeDevices     = MOCK_DEVICES.filter(d => d.status === 'active').length;
  readonly totalTransactions = MOCK_DEVICE_TRANSACTIONS.length;
  readonly totalRevenue      = MOCK_DEVICE_TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
  readonly totalClients      = MOCK_RESELLER.totalClients;

  activityLog = [
    { icon: 'client', labelKey: 'act_client_added', entity: 'Elyes Mansouri',   date: '12 Mar 2026 · 09:41' },
    { icon: 'device', labelKey: 'res_add_device',   entity: 'ACC-BOX-001-2024', date: '11 Mar 2026 · 14:22' },
    { icon: 'client', labelKey: 'act_client_added', entity: 'Sarra Ben Ali',    date: '10 Mar 2026 · 11:05' },
    { icon: 'device', labelKey: 'res_add_device',   entity: 'ACC-PRO-006-2024', date: '09 Mar 2026 · 09:18' },
    { icon: 'client', labelKey: 'act_reseller_upd', entity: 'TechVision SARL',  date: '08 Mar 2026 · 16:44' },
  ];

  dotClass(icon: string): string {
    if (icon === 'client') return 'tl-dot--teal';
    if (icon === 'device') return 'tl-dot--blue';
    return 'tl-dot--amber';
  }

  // ── Helpers ───────────────────────────────────────────
  fmt(n: number) { return new Intl.NumberFormat().format(n); }
  get initials(): string {
    return this.reseller.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  logout(): void { this.router.navigate(['/bo-reseller-access']); }
}