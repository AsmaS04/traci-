import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export default class ProfilComponent implements OnInit {

  i18n = inject(TranslationService);
  private clientService = inject(ClientService);

  profil         = signal<any>(null);
  profilEdit     = signal<any>(null);
  originalProfil = signal<any>(null);
  showEditModal  = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage   = signal<string | null>(null);

  avatarPreview:  string | null = null;
  avatarFile:     File | null   = null;
  uploadError   = '';
  avatarUploading = false;

  ngOnInit() {
    this.loadProfil();
  }

  loadProfil() {
    this.clientService.getMyProfile().subscribe({
      next: (client: Client) => {
        const avatarFullUrl = client.avatarUrl
          ? (client.avatarUrl.startsWith('http') ? client.avatarUrl : 'http://localhost:8080' + client.avatarUrl)
          : '';
        const p = {
          id:                client.idClient,
          prenom:            client.firstName    ?? '',
          nom:               client.lastName     ?? '',
          email:             client.email        ?? '',
          telephone:         client.phone        ?? '',
          adresse:           client.location     ?? '',
          avatarUrl:         avatarFullUrl,
          dateInscription:   client.createdAt    ?? new Date().toISOString(),
          derniereConnexion: new Date().toISOString()
        };
        this.profil.set(p);
        this.originalProfil.set({ ...p });
      },
      error: () => this.showError('Failed to load profile')
    });
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
    this.uploadError  = '';
    this.avatarFile   = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    this.avatarFile    = null;
  }

  saveAvatar(): void {
    if (!this.avatarFile) return;
    this.avatarUploading = true;
    this.clientService.uploadAvatar(this.avatarFile).subscribe({
      next: () => {
        this.avatarPreview   = null;
        this.avatarFile      = null;
        this.avatarUploading = false;
        this.showSuccess('Avatar updated');
        // Reload from server — gets the correct persisted URL
        this.loadProfil();
      },
      error: () => {
        this.avatarUploading = false;
        this.showError('Failed to upload avatar');
      }
    });
  }

  openEditModal() {
    this.profilEdit.set({ ...this.profil() });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.profilEdit.set(null);
  }

  resetForm() {
    this.profil.set({ ...this.originalProfil() });
    this.avatarPreview = null;
    this.avatarFile    = null;
    this.uploadError   = '';
    this.showSuccess('Changes discarded');
  }

  saveProfile() {
    const current = this.profilEdit();
    if (!current) return;

    if (!this.isValidEmail(current.email) || !this.isValidPhone(current.telephone)) {
      this.showError(this.i18n.t('msg_error_invalid_email'));
      return;
    }

    const updatePayload = {
      firstName: current.prenom,
      lastName:  current.nom,
      email:     current.email,
      phone:     current.telephone,
      location:  current.adresse
    };

    this.clientService.updateMyProfile(updatePayload).subscribe({
      next: () => {
        this.closeEditModal();
        this.showSuccess('Profile updated');
        // Reload to get fresh data
        this.loadProfil();
      },
      error: () => this.showError('Failed to update profile')
    });
  }

  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim());
  }

  isValidPhone(p: string): boolean {
    return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, ''));
  }

  get editEmailError(): string {
    const e = this.profilEdit()?.email ?? '';
    return e && !this.isValidEmail(e) ? 'msg_error_invalid_email' : '';
  }

  get editPhoneError(): string {
    const p = this.profilEdit()?.telephone ?? '';
    return p && !this.isValidPhone(p) ? 'msg_error_invalid_phone' : '';
  }

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  showError(msg: string) {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 3000);
  }

  getInitiales(): string {
    const p = this.profil();
    if (!p) return '??';
    return ((p.prenom?.[0] ?? '') + (p.nom?.[0] ?? '')).toUpperCase() || '??';
  }

  getJoursMembre(): number {
    const p = this.profil();
    if (!p) return 0;
    return Math.floor((Date.now() - new Date(p.dateInscription).getTime()) / 86400000);
  }
}