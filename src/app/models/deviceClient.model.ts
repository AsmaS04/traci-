// src/app/models/deviceClient.model.ts

export interface ClientDevice {
  id: number;
  clientId: number;
  resellerId: number;
  serialNumber: string;
  model: string;
  activationDate: string;
  expirationDate: string;
  price: number;
  status: 'active' | 'expired';
  hasSim: boolean;
  simNumber?: string;
  simProvider?: string;
  simOwnedBy: 'client' | 'reseller' | 'none';
}

export interface DeviceTransaction {
  id: number;
  deviceId: number;
  type: 'activation' | 'renewal' | 'suspension' | 'reactivation';
  date: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
}

// Enums pour les types et statuts
export const DEVICE_TYPES = {
  BOX: 'ACCENT BOX',
  MINI: 'ACCENT MINI',
  PRO: 'ACCENT PRO',
  LITE: 'ACCENT LITE'
} as const;

export const DEVICE_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired'
} as const;
