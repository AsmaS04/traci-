// src/app/models/forfait.model.ts

export enum DureeAbonnement {
  UN_MOIS = 'UN_MOIS',
  TROIS_MOIS = 'TROIS_MOIS',
  SIX_MOIS = 'SIX_MOIS',
  UN_AN = 'UN_AN'
}

export interface Forfait {
  duree: DureeAbonnement;
  dureeLabel: string;
  prix: number;
  economie?: number;
  populaire?: boolean;
}

// Helper: Get duration in months
export function getDureeInMonths(duree: DureeAbonnement): number {
  const months: Record<DureeAbonnement, number> = {
    [DureeAbonnement.UN_MOIS]: 1,
    [DureeAbonnement.TROIS_MOIS]: 3,
    [DureeAbonnement.SIX_MOIS]: 6,
    [DureeAbonnement.UN_AN]: 12
  };
  return months[duree];
}

// Helper: Get label
export function getDureeLabel(duree: DureeAbonnement): string {
  const labels: Record<DureeAbonnement, string> = {
    [DureeAbonnement.UN_MOIS]: '1 Mois',
    [DureeAbonnement.TROIS_MOIS]: '3 Mois',
    [DureeAbonnement.SIX_MOIS]: '6 Mois',
    [DureeAbonnement.UN_AN]: '1 An'
  };
  return labels[duree];
}

// Les forfaits disponibles
export const FORFAITS_DISPONIBLES: Forfait[] = [
  {
    duree: DureeAbonnement.UN_MOIS,
    dureeLabel: '1 Mois',
    prix: 50,
    economie: 0,
    populaire: false
  },
  {
    duree: DureeAbonnement.TROIS_MOIS,
    dureeLabel: '3 Mois',
    prix: 135,
    economie: 10,
    populaire: false
  },
  {
    duree: DureeAbonnement.SIX_MOIS,
    dureeLabel: '6 Mois',
    prix: 250,
    economie: 17,
    populaire: true
  },
  {
    duree: DureeAbonnement.UN_AN,
    dureeLabel: '1 An',
    prix: 450,
    economie: 25,
    populaire: false
  }
];
