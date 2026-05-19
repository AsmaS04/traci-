import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ToastService } from '../../../service/Toast.service';

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
}