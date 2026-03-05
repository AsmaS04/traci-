// src/app/data/reseller-mock-data.ts
import { Reseller } from '../models/reseller.model';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface ResellerClient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  region: string;
  deviceSource: 'own' | 'external';   // client owns device or external device
  simSource: 'own' | 'reseller';      // client has own SIM or uses reseller's
  serverType: 'traci' | 'own';        // Traci server or reseller's own server
  amountPaid: number;                 // how much the client paid
  status: 'active' | 'inactive';
  joinDate: string;
  devices: number;
  active: number;
  lastActivity: string;
}

export interface ResellerDashboardActivity {
  icon: 'client' | 'device_assigned' | 'device_deactivated';
  labelKey: string;
  sub: string;
  time: string;
  unit: string;
}

export interface ExpiringDevice {
  id: string;
  client: string;
  daysLeft: number;
}

export interface ResellerDeviceStats {
  total: number;
  active: number;
  offline: number;
  unassigned: number;
  neverActivated: number;
  newClientsMonth: number;
  prevMonthClients: number;
}

// ── Logged-in reseller ──────────────────────────────────────────────────────

export const MOCK_RESELLER: Reseller = {
  id: 1,
  name: 'Khalil Mansour',
  companyName: 'TechVision SARL',
  email: 'khalil@techvision.tn',
  phone: '+216 71 234 567',
  address: '12 Rue de Marseille, Tunis 1000',
  region: 'Tunis',
  serverType: 'shared',
  totalClients: 24,
  clientIds: [1, 2, 3, 4, 5, 6],
  joinDate: '2023-02-14',
};

// ── Device & client stats ───────────────────────────────────────────────────

export const MOCK_RESELLER_DEVICE_STATS: ResellerDeviceStats = {
  total:            138,
  active:           127,
  offline:            6,
  unassigned:         3,
  neverActivated:     2,
  newClientsMonth:    3,
  prevMonthClients:  21,
};

// ── Clients ─────────────────────────────────────────────────────────────────

export const MOCK_RESELLER_CLIENTS: ResellerClient[] = [
  {
    id: 1, firstName: 'Elyes',    lastName: 'Mansouri',
    email: 'elyes@mansouri.tn',   phone: '+216 20 111 001',
    region: 'Tunis',  deviceSource: 'own',      simSource: 'reseller',
    serverType: 'traci',  amountPaid: 350,
    status: 'active',   joinDate: '2024-01-10',
    devices: 18, active: 17, lastActivity: '2 min ago',
  },
  {
    id: 2, firstName: 'Sarra',    lastName: 'Ben Ali',
    email: 'sarra@alphacorp.tn',  phone: '+216 20 111 002',
    region: 'Sfax',   deviceSource: 'external',  simSource: 'own',
    serverType: 'own',    amountPaid: 420,
    status: 'active',   joinDate: '2024-02-15',
    devices: 24, active: 21, lastActivity: '1 hr ago',
  },
  {
    id: 3, firstName: 'Mohamed',  lastName: 'Chaabane',
    email: 'med@tndigital.tn',    phone: '+216 20 111 003',
    region: 'Sousse', deviceSource: 'own',      simSource: 'reseller',
    serverType: 'traci',  amountPaid: 280,
    status: 'active',   joinDate: '2024-03-20',
    devices: 12, active: 12, lastActivity: '3 hr ago',
  },
  {
    id: 4, firstName: 'Amira',    lastName: 'Trabelsi',
    email: 'amira@medtech.tn',    phone: '+216 20 111 004',
    region: 'Bizerte',deviceSource: 'external',  simSource: 'own',
    serverType: 'own',    amountPaid: 510,
    status: 'inactive', joinDate: '2023-11-05',
    devices:  8, active:  5, lastActivity: 'Yesterday',
  },
  {
    id: 5, firstName: 'Youssef',  lastName: 'Ferchichi',
    email: 'youssef@smart.tn',    phone: '+216 20 111 005',
    region: 'Nabeul', deviceSource: 'own',      simSource: 'reseller',
    serverType: 'traci',  amountPaid: 390,
    status: 'active',   joinDate: '2024-01-28',
    devices: 31, active: 29, lastActivity: '5 min ago',
  },
  {
    id: 6, firstName: 'Mariem',   lastName: 'Belhaj',
    email: 'mariem@innovate.tn',  phone: '+216 20 111 006',
    region: 'Tunis',  deviceSource: 'external',  simSource: 'own',
    serverType: 'traci',  amountPaid: 220,
    status: 'active',   joinDate: '2024-04-12',
    devices:  9, active:  7, lastActivity: '2 days ago',
  },
];

// ── Dashboard activity ──────────────────────────────────────────────────────

export const MOCK_RESELLER_DASHBOARD_ACTIVITY: ResellerDashboardActivity[] = [
  { icon: 'client',             labelKey: 'res_act_client_created',     sub: 'InnovateTN',           time: '12', unit: 'min_ago'  },
  { icon: 'device_assigned',    labelKey: 'res_act_device_assigned',    sub: 'Device #4821 → Elyes', time: '1',  unit: 'hr_ago'   },
  { icon: 'device_deactivated', labelKey: 'res_act_device_deactivated', sub: 'Device #2190',         time: '3',  unit: 'hr_ago'   },
  { icon: 'client',             labelKey: 'res_act_client_created',     sub: 'Alpha Corp',           time: '2',  unit: 'days_ago' },
  { icon: 'device_assigned',    labelKey: 'res_act_device_assigned',    sub: 'Device #3302 → Smart', time: '3',  unit: 'days_ago' },
];

// ── Expiring devices ────────────────────────────────────────────────────────

export const MOCK_EXPIRING_DEVICES: ExpiringDevice[] = [
  { id: '#4821', client: 'Société Elyes', daysLeft:  5 },
  { id: '#3302', client: 'Smart Systems', daysLeft:  9 },
  { id: '#2190', client: 'Alpha Corp',    daysLeft: 14 },
];

// ── Notifications ───────────────────────────────────────────────────────────

export const MOCK_RESELLER_NOTIFICATIONS = [
  { text: 'Device #3302 went offline', time: '3 hr ago'   },
  { text: 'InnovateTN was added',      time: '12 min ago' },
  { text: 'Device #4821 was assigned', time: '1 hr ago'   },
];