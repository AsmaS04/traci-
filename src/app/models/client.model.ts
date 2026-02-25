export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  region: string;
  resellerId: number;
  resellerName: string;
  totalDevices: number;
  activeDevices: number;
  isActive: boolean;
  joinDate: string;
}