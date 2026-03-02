// src/app/models/paiement.model.ts

export enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  ECHOUE = 'ECHOUE',
  REMBOURSE = 'REMBOURSE'
}

export interface PaiementRequest {
  clientId: number;
  abonnementId: number;
  forfaitId: string;
  montant: number;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvCode: string;
  remember: boolean;
}

export interface PaiementResponse {
  id: number;
  statut: StatutPaiement;
  montant: number;
  datePaiement: string;
  konnectPaymentUrl?: string;
  message?: string;
}
