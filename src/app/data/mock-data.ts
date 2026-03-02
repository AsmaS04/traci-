// src/app/data/mock-data.ts

import {
  Abonnement,
  StatutAbonnement,
  getJoursRestants
} from '../models/abonnement.model';
import {
  Facture,
  StatutFacture
} from '../models/facture.model';
import { ProfilClient } from '../models/profil-client.model';

/* ══════════════════════════════════════════════════════════════
   USER DATA
   ══════════════════════════════════════════════════════════════ */

export const MOCK_USER = {
  id: 1,
  prenom: 'Ahmed',
  nom: 'Ben Ali',
  email: 'ahmed.benali@example.com',
  avatar: 'AB',
  role: 'Client'
};

/* ══════════════════════════════════════════════════════════════
   PROFIL CLIENT
   ══════════════════════════════════════════════════════════════ */

export const MOCK_PROFIL: ProfilClient = {
  id: 1,
  prenom: 'Ahmed',
  nom: 'Ben Ali',
  email: 'ahmed.benali@example.com',
  telephone: '+216 98 765 432',
  adresse: '15 Avenue Habib Bourguiba',
  ville: 'Tunis',
  codePostal: '1000',
  avatar: 'from-teal-400 to-cyan-500',
  dateInscription: '2024-06-15',
  derniereConnexion: '2026-03-01',
  preferences: {
    notifications: true,
    newsletter: true,
    langue: 'fr'
  }
};

/* ══════════════════════════════════════════════════════════════
   ABONNEMENT ACTUEL
   ══════════════════════════════════════════════════════════════ */

export const MOCK_ABONNEMENT_ACTUEL: Abonnement = {
  id: 1,
  clientId: 1,
  serviceNom: 'Service IoT Premium',
  serviceId: 1,
  duree: 3, // 3 mois
  dureeLabel: '3 Mois',
  prix: 135,
  dateDebut: '2026-01-01',
  dateFin: '2026-03-15',
  statut: StatutAbonnement.ACTIF,
  joursRestants: getJoursRestants('2026-03-15'),
  autoRenouvellement: false
};

/* ══════════════════════════════════════════════════════════════
   HISTORIQUE ABONNEMENTS
   ══════════════════════════════════════════════════════════════ */

export const MOCK_ABONNEMENTS: Abonnement[] = [
  {
    id: 1,
    clientId: 1,
    serviceNom: 'Service IoT Premium',
    serviceId: 1,
    duree: 3,
    dureeLabel: '3 Mois',
    prix: 135,
    dateDebut: '2026-01-01',
    dateFin: '2026-03-15',
    statut: StatutAbonnement.ACTIF,
    joursRestants: getJoursRestants('2026-03-15'),
    autoRenouvellement: false
  },
  {
    id: 2,
    clientId: 1,
    serviceNom: 'Service IoT Basic',
    serviceId: 2,
    duree: 1,
    dureeLabel: '1 Mois',
    prix: 50,
    dateDebut: '2025-12-01',
    dateFin: '2025-12-31',
    statut: StatutAbonnement.EXPIRE,
    joursRestants: 0,
    autoRenouvellement: false
  },
  {
    id: 3,
    clientId: 1,
    serviceNom: 'Service IoT Standard',
    serviceId: 3,
    duree: 6,
    dureeLabel: '6 Mois',
    prix: 250,
    dateDebut: '2025-06-01',
    dateFin: '2025-11-30',
    statut: StatutAbonnement.EXPIRE,
    joursRestants: 0,
    autoRenouvellement: false
  },
  {
    id: 4,
    clientId: 1,
    serviceNom: 'Service IoT Pro',
    serviceId: 4,
    duree: 12,
    dureeLabel: '1 An',
    prix: 450,
    dateDebut: '2024-08-01',
    dateFin: '2024-10-15',
    statut: StatutAbonnement.ANNULE,
    joursRestants: 0,
    autoRenouvellement: false
  }
];

/* ══════════════════════════════════════════════════════════════
   FACTURES
   ══════════════════════════════════════════════════════════════ */

export const MOCK_FACTURES: Facture[] = [
  {
    id: 1,
    numero: 'INV-2026-001',
    clientId: 1,
    serviceNom: 'Service IoT Premium',
    abonnementId: 1,
    montantHT: 115,
    tva: 20,
    montantTTC: 135,
    dateEmission: '2026-01-01',
    dateEcheance: '2026-01-15',
    datePaiement: '2026-01-05',
    statut: StatutFacture.PAYEE,
    modePaiement: 'Konnect',
    lignes: []
  },
  {
    id: 2,
    numero: 'INV-2026-002',
    clientId: 1,
    serviceNom: 'Service IoT Basic',
    abonnementId: 2,
    montantHT: 42.5,
    tva: 7.5,
    montantTTC: 50,
    dateEmission: '2025-12-01',
    dateEcheance: '2025-12-15',
    statut: StatutFacture.EN_ATTENTE,
    modePaiement: 'Konnect',
    lignes: []
  },
  {
    id: 3,
    numero: 'INV-2025-099',
    clientId: 1,
    serviceNom: 'Service IoT Standard',
    abonnementId: 3,
    montantHT: 212.5,
    tva: 37.5,
    montantTTC: 250,
    dateEmission: '2025-06-01',
    dateEcheance: '2025-06-15',
    datePaiement: '2025-06-10',
    statut: StatutFacture.PAYEE,
    modePaiement: 'Carte bancaire',
    lignes: []
  },
  {
    id: 4,
    numero: 'INV-2025-050',
    clientId: 1,
    serviceNom: 'Service IoT Pro',
    abonnementId: 4,
    montantHT: 382.5,
    tva: 67.5,
    montantTTC: 450,
    dateEmission: '2024-08-01',
    dateEcheance: '2024-08-15',
    statut: StatutFacture.ECHUE,
    modePaiement: 'Konnect',
    lignes: []
  },
  {
    id: 5,
    numero: 'INV-2025-075',
    clientId: 1,
    serviceNom: 'Service IoT Premium',
    abonnementId: 1,
    montantHT: 115,
    tva: 20,
    montantTTC: 135,
    dateEmission: '2025-10-01',
    dateEcheance: '2025-10-15',
    datePaiement: '2025-10-08',
    statut: StatutFacture.PAYEE,
    modePaiement: 'Konnect',
    lignes: []
  },
  {
    id: 6,
    numero: 'INV-2025-045',
    clientId: 1,
    serviceNom: 'Service IoT Standard',
    abonnementId: 3,
    montantHT: 212.5,
    tva: 37.5,
    montantTTC: 250,
    dateEmission: '2025-07-01',
    dateEcheance: '2025-07-15',
    datePaiement: '2025-07-12',
    statut: StatutFacture.PAYEE,
    modePaiement: 'Carte bancaire',
    lignes: []
  },
  {
    id: 7,
    numero: 'INV-2025-020',
    clientId: 1,
    serviceNom: 'Service IoT Basic',
    abonnementId: 2,
    montantHT: 42.5,
    tva: 7.5,
    montantTTC: 50,
    dateEmission: '2025-05-01',
    dateEcheance: '2025-05-15',
    datePaiement: '2025-05-14',
    statut: StatutFacture.PAYEE,
    modePaiement: 'Virement bancaire',
    lignes: []
  },
  {
    id: 8,
    numero: 'INV-2024-150',
    clientId: 1,
    serviceNom: 'Service IoT Pro',
    abonnementId: 4,
    montantHT: 382.5,
    tva: 67.5,
    montantTTC: 450,
    dateEmission: '2024-12-01',
    dateEcheance: '2024-12-15',
    datePaiement: '2024-12-10',
    statut: StatutFacture.PAYEE,
    modePaiement: 'Konnect',
    lignes: []
  }
];

/* ══════════════════════════════════════════════════════════════
   STATS DASHBOARD
   ══════════════════════════════════════════════════════════════ */

export const MOCK_STATS = {
  totalPaye: MOCK_FACTURES
    .filter(f => f.statut === StatutFacture.PAYEE)
    .reduce((sum, f) => sum + f.montantTTC, 0),
  nombreFactures: MOCK_FACTURES.filter(f => f.statut === StatutFacture.PAYEE).length,
  support: '24/7'
};

/* ══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ══════════════════════════════════════════════════════════════ */

// Get factures by status
export function getFacturesByStatut(statut: StatutFacture): Facture[] {
  return MOCK_FACTURES.filter(f => f.statut === statut);
}

// Get abonnements by status
export function getAbonnementsByStatut(statut: StatutAbonnement): Abonnement[] {
  return MOCK_ABONNEMENTS.filter(a => a.statut === statut);
}

// Get latest factures (limit)
export function getLatestFactures(limit: number = 5): Facture[] {
  return MOCK_FACTURES
    .sort((a, b) => new Date(b.dateEmission).getTime() - new Date(a.dateEmission).getTime())
    .slice(0, limit);
}

// Get facture by numero
export function getFactureByNumero(numero: string): Facture | undefined {
  return MOCK_FACTURES.find(f => f.numero === numero);
}

// Get abonnement by id
export function getAbonnementById(id: number): Abonnement | undefined {
  return MOCK_ABONNEMENTS.find(a => a.id === id);
}

// Get montant total for facture
export function getMontantTotal(facture: Facture): number {
  return facture.montantTTC;
}
