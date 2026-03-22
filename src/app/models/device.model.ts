export type DeviceStatus     = 'active' | 'expired' | 'inactive';
export type DeviceModel      = 'ACCENT BOX' | 'ACCENT MINI' | 'ACCENT PRO' | 'ACCENT LITE';
export type SimProvider      = 'Ooredoo' | 'Tunisie Telecom' | 'Orange' | 'none';
export type TransactionType  = 'device_sale' | 'renewal';

export interface ClientDevice {
  id:             number;
  clientId:       number;
  resellerId:     number;
  serialNumber:   string;
  model:          DeviceModel;
  activationDate: string;
  expirationDate: string;
  price:          number;
  status:         DeviceStatus;
  hasSim:         boolean;
  simNumber:      string | null;
  simProvider:    SimProvider;
  simOwnedBy:     'client' | 'reseller' | 'none';
}

export interface DeviceTransaction {
  id:         number;
  deviceId:   number;
  clientId:   number;
  resellerId: number;
  serial:     string;
  model:      DeviceModel;
  type:       TransactionType;   // ← NEW
  amount:     number;
  date:       string;
  notes:      string;
}