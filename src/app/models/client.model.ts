export interface Client {
  idClient: number;
  email: string;
  login: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  graceDaysLeft: number | null;
  graceDaysUsed: number | null;
  idRev: number | null;
  resellerName: string | null;
  createdAt: string;
  region: string;
  status?: string;
  avatarUrl?: string;
  subscriptionStatus?: 'active' | 'expired' | 'pending' | 'none';
}