import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';
import { ResellerService } from '../../../service/Reseller.service';
import { ClientService } from '../../../service/Client.service';
import { DeviceService } from '../../../service/Device.service';
import { NotificationWebsocketService, AvatarEvent } from '../../../service/notification-websocket.service';
import { Reseller } from '../../../models/reseller.model';
import { Subscription } from 'rxjs';

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
  private deviceService   = inject(DeviceService);
  private wsService       = inject(NotificationWebsocketService);
  private router          = inject(Router);
  public  i18n            = inject(TranslationService);

  reseller = signal<Reseller | null>(null);
  profileEdit = signal<any>(null);
  showEditModal = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  avatarPreview:  string | null = null;
  avatarFile:     File | null   = null;
  uploadError = '';
  avatarUploading = false;

  private avatarSub?: Subscription;

  ngOnInit() {
    this.loadProfile();
    this.wsService.connect();
    this.avatarSub = this.wsService.avatar$.subscribe((event: AvatarEvent) => {
      if (event.avatarUrl) {
        const fullUrl = event.avatarUrl.startsWith('http')
          ? event.avatarUrl
          : 'http://localhost:8080' + event.avatarUrl;
        this.reseller.update(r => {
          if (!r) return r;
          return { ...r, avatarUrl: fullUrl };
        });
        this.avatarPreview = null;
      }
    });
  }

  ngOnDestroy() {
    this.avatarSub?.unsubscribe();
  }

  loadProfile() {
    this.resellerService.getMyProfile().subscribe({
      next: (r: Reseller) => {
        const avatarFullUrl = r.avatarUrl
          ? (r.avatarUrl.startsWith('http') ? r.avatarUrl : 'http://localhost:8080' + r.avatarUrl)
          : '';
        this.reseller.set({ ...r, avatarUrl: avatarFullUrl });
      },
      error: () => this.showError('Failed to load profile')
    });
  }

  // Avatar
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
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  saveAvatar(): void {
    if (!this.avatarFile) return;
    this.avatarUploading = true;
    this.resellerService.uploadAvatar(this.avatarFile).subscribe({
      next: () => {
        this.avatarPreview = null;
        this.avatarFile = null;
        this.avatarUploading = false;
        this.showSuccess('Avatar updated');
        this.loadProfile(); // reload to get persisted URL
      },
      error: () => {
        this.avatarUploading = false;
        this.showError('Failed to upload avatar');
      }
    });
  }

  // Edit profile modal
  openEditModal() {
    const r = this.reseller();
    if (!r) return;
    this.profileEdit.set({
      username: r.username,
      nomEntreprise: r.nomEntreprise,
      email: r.email,
      phone: r.phone ?? '',
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.profileEdit.set(null);
  }

  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim());
  }

  isValidPhone(p: string): boolean {
    return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, ''));
  }

  get editEmailError(): string {
    const e = this.profileEdit()?.email ?? '';
    return e && !this.isValidEmail(e) ? 'msg_error_invalid_email' : '';
  }

  get editPhoneError(): string {
    const p = this.profileEdit()?.phone ?? '';
    return p && !this.isValidPhone(p) ? 'msg_error_invalid_phone' : '';
  }

  saveProfile() {
    const edit = this.profileEdit();
    if (!edit) return;
    if (!this.isValidEmail(edit.email) || !this.isValidPhone(edit.phone)) {
      this.showError(this.i18n.t('msg_error_invalid_email'));
      return;
    }
    const payload = {
      username: edit.username,
      nomEntreprise: edit.nomEntreprise,
      email: edit.email,
      phone: edit.phone,
    };
    this.resellerService.updateMyProfile(payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.showSuccess('Profile updated');
        this.loadProfile();
      },
      error: () => this.showError('Failed to update profile')
    });
  }

  // Member since
  get memberSinceDays(): number {
    const r = this.reseller();
    if (!r || !r.createdAt) return 0;
    const created = new Date(r.createdAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  initials(): string {
    const r = this.reseller();
    if (!r) return 'R';
    return (r.username || 'R').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  showError(msg: string) {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 3000);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/bo-reseller-access']);
  }
}