// src/app/models/abonnement.model.ts

export enum StatutAbonnement {
  ACTIF = 'ACTIF',
  EXPIRE = 'EXPIRE',
  ANNULE = 'ANNULE'
}

export interface Abonnement {
  id: number;
  clientId: number;
  serviceNom: string;
  serviceId: number;
  duree: number; // Durée en mois
  dureeLabel: string;
  prix: number;
  dateDebut: string;
  dateFin: string;
  statut: StatutAbonnement;
  joursRestants: number;
  autoRenouvellement: boolean;
}

// Helper function: Get jours restants
export function getJoursRestants(dateFin: string): number {
  const fin = new Date(dateFin).getTime();
  const maintenant = new Date().getTime();
  const diffMs = fin - maintenant;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper function: Check if expiring soon (≤7 days)
export function isAbonnementExpiringSoon(joursRestants: number): boolean {
  return joursRestants > 0 && joursRestants <= 7;
}
