import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';

type TabName = 'profile' | 'security' | 'notifications' | 'activity' ;

@Component({
  selector: 'app-admin-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class AdminProfil {

  constructor(public i18n: TranslationService) {}

  // ── Active tab ────────────────────────────────────────
  activeTab: TabName = 'profile';
  switchTab(tab: TabName) { this.activeTab = tab; }

  // ── Avatar / photo upload ─────────────────────────────
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  uploadError = '';

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'adm_upload_type_error';
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.uploadError = 'adm_upload_size_error';
      return;
    }
    
    this.uploadError = '';
    this.avatarFile = file;
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    this.avatarFile = null;
  }

  get initials(): string {
    return `${this.profile.firstName[0]}${this.profile.lastName[0]}`.toUpperCase();
  }

  // ── Profile form ──────────────────────────────────────
  profile = {
    firstName: 'Asma',
    lastName:  'Souissi',
    email:     'asma@traci.com',
    phone:     '55123456',
    company:   'TRACI Platform',
    position:  'Super Administrator',
    bio:       'Managing the TRACI platform for enterprise IoT device management across Tunisia and North Africa.',
  };

  // ── Validation ────────────────────────────────────────
  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }
  isValidPhone(p: string): boolean {
    return /^\d{8}$/.test(p.replace(/[\s\-\.]/g, ''));
  }
  get profileEmailError(): string {
    return this.profile.email && !this.isValidEmail(this.profile.email)
      ? 'msg_error_invalid_email' : '';
  }
  get profilePhoneError(): string {
    return this.profile.phone && !this.isValidPhone(this.profile.phone)
      ? 'msg_error_invalid_phone' : '';
  }

  saveProfile() {
    if (!this.isValidEmail(this.profile.email) || !this.isValidPhone(this.profile.phone)) return;
    console.log('Profile saved', this.profile, 'Avatar:', this.avatarFile?.name);
  }

  // ── Security form ─────────────────────────────────────
  security = { currentPassword: '', newPassword: '', confirmPassword: '' };
  twoFaEnabled = false;

  get passwordStrength(): 'weak' | 'medium' | 'strong' {
    const p = this.security.newPassword;
    if (p.length === 0)  return 'weak';
    if (p.length < 8)    return 'weak';
    if (p.length < 12)   return 'medium';
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

  // ── Activity ──────────────────────────────────────────
  todayStats = { clients: 2, resellers: 1, alerts: 3, devices: 0 };

  activityLog = [
    { icon: 'teal',  labelKey: 'act_reseller_reg', entity: 'TechVision SARL',  date: '12 Mar 2026 · 09:41' },
    { icon: 'blue',  labelKey: 'act_client_added', entity: 'Alpha Corp',       date: '11 Mar 2026 · 14:22' },
    { icon: 'red',   labelKey: 'act_device_off',   entity: '#4821',            date: '10 Mar 2026 · 11:05' },
    { icon: 'teal',  labelKey: 'act_client_added', entity: 'Société Elyes',    date: '10 Mar 2026 · 09:18' },
    { icon: 'amber', labelKey: 'adm_view_alerts',  entity: '3 alerts',         date: '09 Mar 2026 · 16:44' },
    { icon: 'blue',  labelKey: 'act_reseller_upd', entity: 'NetPlus Tunis',    date: '08 Mar 2026 · 10:30' },
  ];
  
}