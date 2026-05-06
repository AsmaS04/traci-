import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ToastService } from '../../../service/Toast.service';

type TabName = 'profile'  | 'notifications' | 'activity';

const AVATAR_KEY = 'admin_avatar';

@Component({
  selector: 'app-admin-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class AdminProfil implements OnInit {

  public i18n   = inject(TranslationService);
  private toast = inject(ToastService);

  // ── Active tab ────────────────────────────────────────
  activeTab: TabName = 'profile';
  switchTab(tab: TabName) { this.activeTab = tab; }

  // ── Avatar / photo upload ─────────────────────────────
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  uploadError = '';

  ngOnInit(): void {
    const saved = localStorage.getItem(AVATAR_KEY);
    if (saved) this.avatarPreview = saved;
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.uploadError = 'adm_upload_type_error';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.uploadError = 'adm_upload_size_error';
      return;
    }

    this.uploadError = '';
    this.avatarFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.avatarPreview = result;
      localStorage.setItem(AVATAR_KEY, result);
      this.toast.success('Avatar updated successfully');
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    this.avatarFile = null;
    localStorage.removeItem(AVATAR_KEY);
    this.toast.success('Avatar removed');
  }

  get initials(): string {
    return `${this.profile.firstName[0] ?? ''}${this.profile.lastName[0] ?? ''}`.toUpperCase();
  }

  // ── Profile form ──────────────────────────────────────
  private originalProfile = {
    firstName: 'Asma',
    lastName:  'Souissi',
    email:     'asma@traci.com',
    phone:     '55123456',
    company:   'TRACI Platform',
    position:  'Super Administrator',
    bio:       'Managing the TRACI platform for enterprise IoT device management across Tunisia and North Africa.',
  };

  profile = { ...this.originalProfile };

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

  cancelEditing() {
    this.profile = { ...this.originalProfile };
  }

  saveProfile() {
    if (!this.isValidEmail(this.profile.email) || !this.isValidPhone(this.profile.phone)) return;
    this.originalProfile = { ...this.profile };
    this.toast.success('Profile saved successfully');
  }

  

 


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
    { icon: 'teal',  labelKey: 'act_reseller_reg', entity: 'TechVision SARL', date: '12 Mar 2026 · 09:41' },
    { icon: 'blue',  labelKey: 'act_client_added', entity: 'Alpha Corp',      date: '11 Mar 2026 · 14:22' },
    { icon: 'red',   labelKey: 'act_device_off',   entity: '#4821',           date: '10 Mar 2026 · 11:05' },
    { icon: 'teal',  labelKey: 'act_client_added', entity: 'Société Elyes',   date: '10 Mar 2026 · 09:18' },
    { icon: 'amber', labelKey: 'adm_view_alerts',  entity: '3 alerts',        date: '09 Mar 2026 · 16:44' },
    { icon: 'blue',  labelKey: 'act_reseller_upd', entity: 'NetPlus Tunis',   date: '08 Mar 2026 · 10:30' },
  ];
}