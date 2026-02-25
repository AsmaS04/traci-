export interface Reseller {
  id: number;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  region: string;
  serverType: 'shared' | 'dedicated';
  totalClients: number;
  clientIds: number[];
  joinDate: string;
}