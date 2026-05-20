export interface Reseller {
  idRev: number;
  username: string;
  email: string;
  nomEntreprise: string;
  deviceCostByDay: number | null;
  daysCount: number | null;
  phone: string;
  clientCount: number | null;
  createdAt: string;
  avatarUrl?: string;
  location?: string;
  status?: string;
  deviceCount?: number; 
}