// src/app/features/client/profil/profil.ts

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';
import { ProfilClient } from '../../../models/profil-client.model';
import { MOCK_PROFIL } from '../../../data/mock-data';

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
export default class ProfilComponent implements OnInit {  // ✅ CORRIGÉ ICI!

  // Services
  i18n = inject(TranslationService);

  // Signals
  profil = signal<ProfilClient | null>(null);
  profilEdit = signal<ProfilClient | null>(null);
  showEditModal = signal(false);
  showPasswordModal = signal(false);
  showAvatarModal = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  selectedAvatarColor = signal<string>('from-teal-400 to-cyan-500');

  // Password form
  passwordForm: MotDePasseForm = {
    ancien: '',
    nouveau: '',
    confirmation: ''
  };

  // Avatar colors
  avatarColors = [
    'from-teal-400 to-cyan-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-red-500',
    'from-green-400 to-emerald-500',
    'from-yellow-400 to-orange-500'
  ];

  ngOnInit() {
    this.loadProfil();
  }

  loadProfil() {
    // Load profil from mock data
    this.profil.set(MOCK_PROFIL);
    this.profilEdit.set({ ...MOCK_PROFIL });
  }

  // Edit Profile Modal
  openEditModal() {
    this.profilEdit.set({ ...this.profil()! });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  saveProfile() {
    const updated = this.profilEdit();
    if (!updated) return;

    // TODO: API call pour sauvegarder le profil
    this.profil.set({ ...updated });
    this.showEditModal.set(false);
    this.showSuccess('Profil mis à jour avec succès!');
  }

  // Password Modal
  openPasswordModal() {
    this.passwordForm = {
      ancien: '',
      nouveau: '',
      confirmation: ''
    };
    this.showPasswordModal.set(true);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
  }

  changePassword() {
    const { ancien, nouveau, confirmation } = this.passwordForm;

    // Validation
    if (!ancien || !nouveau || !confirmation) {
      this.showError('Veuillez remplir tous les champs');
      return;
    }

    if (nouveau.length < 8) {
      this.showError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (nouveau !== confirmation) {
      this.showError('Les mots de passe ne correspondent pas');
      return;
    }

    // TODO: API call pour changer le mot de passe
    this.showPasswordModal.set(false);
    this.showSuccess('Mot de passe modifié avec succès!');

    // Reset form
    this.passwordForm = {
      ancien: '',
      nouveau: '',
      confirmation: ''
    };
  }

  // Avatar Modal
  openAvatarModal() {
    this.showAvatarModal.set(true);
  }

  closeAvatarModal() {
    this.showAvatarModal.set(false);
  }

  selectAvatarColor(color: string) {
    this.selectedAvatarColor.set(color);
  }

  saveAvatar() {
    // TODO: API call pour sauvegarder l'avatar
    this.showAvatarModal.set(false);
    this.showSuccess('Avatar mis à jour avec succès!');
  }

  // Preferences
  updatePreferences(key: 'notifications' | 'newsletter' | 'langue', value: any) {
    const currentProfil = this.profil();
    if (!currentProfil) return;

    const updated = {
      ...currentProfil,
      preferences: {
        ...currentProfil.preferences,
        [key]: value
      }
    };

    // TODO: API call pour sauvegarder les préférences
    this.profil.set(updated);
    this.showSuccess(`Préférence "${key}" mise à jour!`);
  }

  // Messages
  showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(null), 3000);
  }

  // Helpers
  getInitiales(): string {
    const p = this.profil();
    if (!p) return '??';
    return (p.prenom.charAt(0) + p.nom.charAt(0)).toUpperCase();
  }

  getJoursMembre(): number {
    const p = this.profil();
    if (!p) return 0;

    const inscription = new Date(p.dateInscription).getTime();
    const maintenant = new Date().getTime();
    const diffMs = maintenant - inscription;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
