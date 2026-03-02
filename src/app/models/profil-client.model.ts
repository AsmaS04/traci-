// src/app/models/profil-client.model.ts

export interface ProfilClient {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  codePostal: string;
  avatar: string;
  dateInscription: string;
  derniereConnexion: string;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    langue: string;
  };
}

export interface MotDePasseForm {
  ancien: string;
  nouveau: string;
  confirmation: string;
}
