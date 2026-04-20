import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ClientService } from '../../../service/Client.service';
import { Client } from '../../../models/client.model';

interface MotDePasseForm {
  ancien: string;
  nouveau: string;
  confirmation: string;
}

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

  profil = signal<any>(null);
  profilEdit = signal<any>(null);
  showEditModal = signal(false);
  showPasswordModal = signal(false);
  showAvatarModal = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  selectedAvatarColor = signal<string>('from-teal-400 to-cyan-500');

  passwordForm: MotDePasseForm = { ancien: '', nouveau: '', confirmation: '' };

  avatarColors = [
    'from-teal-400 to-cyan-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-red-500',
    'from-green-400 to-emerald-500',
    'from-yellow-400 to-orange-500'
  ];

  ngOnInit() { this.loadProfil(); }

  loadProfil() {
    this.clientService.getMyProfile().subscribe({
      next: (client: Client) => {
        const p = {
          id: client.idClient,
          prenom: client.firstName ?? '',
          nom: client.lastName ?? '',
          email: client.email ?? '',
          telephone: client.phone ?? '',
          adresse: client.location ?? '',
          ville: '',
          codePostal: '',
          avatar: 'from-teal-400 to-cyan-500',
          dateInscription: client.createdAt ?? '2024-01-01',
          derniereConnexion: new Date().toISOString(),
          preferences: { notifications: true, newsletter: true, langue: 'fr' }
        };
        this.profil.set(p);
        this.profilEdit.set({ ...p });
      },
      error: (err: any) => {
        console.error('Failed to load profile', err);
        // Fallback to basic info from auth
        const p = {
          id: 0, prenom: 'Client', nom: '', email: '',
          telephone: '', adresse: '', ville: '', codePostal: '',
          avatar: 'from-teal-400 to-cyan-500',
          dateInscription: '2024-01-01',
          derniereConnexion: new Date().toISOString(),
          preferences: { notifications: true, newsletter: true, langue: 'fr' }
        };
        this.profil.set(p);
        this.profilEdit.set({ ...p });
      }
    });
  }

  openEditModal() {
    this.profilEdit.set({ ...this.profil()! });
    this.showEditModal.set(true);
  }
  closeEditModal() { this.showEditModal.set(false); }

  isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e ?? '').trim()); }
  isValidPhone(p: string): boolean { return /^\d{8}$/.test((p ?? '').replace(/[\s\-\.]/g, '')); }
  get editEmailError(): string {
    const e = this.profilEdit()?.email ?? '';
    return e && !this.isValidEmail(e) ? 'msg_error_invalid_email' : '';
  }
  get editPhoneError(): string {
    const p = this.profilEdit()?.telephone ?? '';
    return p && !this.isValidPhone(p) ? 'msg_error_invalid_phone' : '';
  }

  saveProfile() {
    const updated = this.profilEdit();
    if (!updated) return;
    if (!this.isValidEmail(updated.email ?? '') || !this.isValidPhone(updated.telephone ?? '')) {
      this.showError(this.i18n.t('msg_error_invalid_email'));
      return;
    }
    // TODO: call backend PUT /api/client/profile
    this.profil.set({ ...updated });
    this.showEditModal.set(false);
    this.showSuccess('Profil mis à jour avec succès!');
  }

  openPasswordModal() { this.passwordForm = { ancien: '', nouveau: '', confirmation: '' }; this.showPasswordModal.set(true); }
  closePasswordModal() { this.showPasswordModal.set(false); }

  changePassword() {
    const { ancien, nouveau, confirmation } = this.passwordForm;
    if (!ancien || !nouveau || !confirmation) { this.showError('Veuillez remplir tous les champs'); return; }
    if (nouveau.length < 8) { this.showError('Le nouveau mot de passe doit contenir au moins 8 caractères'); return; }
    if (nouveau !== confirmation) { this.showError('Les mots de passe ne correspondent pas'); return; }
    this.showPasswordModal.set(false);
    this.showSuccess('Mot de passe modifié avec succès!');
    this.passwordForm = { ancien: '', nouveau: '', confirmation: '' };
  }

  openAvatarModal() { this.showAvatarModal.set(true); }
  closeAvatarModal() { this.showAvatarModal.set(false); }
  selectAvatarColor(color: string) { this.selectedAvatarColor.set(color); }
  saveAvatar() { this.showAvatarModal.set(false); this.showSuccess('Avatar mis à jour avec succès!'); }

  updatePreferences(key: 'notifications' | 'newsletter' | 'langue', value: any) {
    const current = this.profil();
    if (!current) return;
    this.profil.set({ ...current, preferences: { ...current.preferences, [key]: value } });
    this.showSuccess(`Préférence "${key}" mise à jour!`);
  }

  showSuccess(message: string) { this.successMessage.set(message); setTimeout(() => this.successMessage.set(null), 3000); }
  showError(message: string) { this.errorMessage.set(message); setTimeout(() => this.errorMessage.set(null), 3000); }

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