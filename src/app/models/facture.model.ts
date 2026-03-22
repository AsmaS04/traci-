// src/app/models/facture.model.ts

export enum StatutFacture {
  PAYEE = 'PAYED',
  EN_ATTENTE = 'PENDING',
  ECHUE = 'ECHUE'
}

export interface LigneFacture {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

export interface Facture {
  id: number;
  numero: string;
  clientId: number;
  abonnementId: number;
  serviceNom: string;
  dateEmission: string;
  dateEcheance: string;
  datePaiement?: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  statut: StatutFacture;
  lignes: LigneFacture[];
  modePaiement?: string;
  numeroPaiement?: string;
}
