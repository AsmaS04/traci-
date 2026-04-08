// src/app/data/mock-devicesClient.data.ts

import { ClientDevice } from '../models/deviceClient.model';

export const MOCK_DEVICES: ClientDevice[] = [
  // Client 1: Ahmed (3 devices)
  {
    id: 1,
    clientId: 1,
    resellerId: 1,
    serialNumber: 'ACC-BOX-001-2024',
    model: 'ACCENT BOX',
    activationDate: '2024-01-10',
    expirationDate: '2025-01-10',
    price: 150,
    status: computeStatus('2025-01-10'),
    hasSim: true,
    simNumber: '216-98-765-432',
    simProvider: 'Ooredoo',
    simOwnedBy: 'client'
  },
  {
    id: 2,
    clientId: 1,
    resellerId: 1,
    serialNumber: 'ACC-MINI-002-2024',
    model: 'ACCENT MINI',
    activationDate: '2024-03-15',
    expirationDate: '2025-03-15',
    price: 100,
    status: computeStatus('2025-03-15'),
    hasSim: true,
    simNumber: '216-98-123-456',
    simProvider: 'Orange',
    simOwnedBy: 'reseller'
  },
  {
    id: 3,
    clientId: 1,
    resellerId: 1,
    serialNumber: 'ACC-PRO-003-2023',
    model: 'ACCENT PRO',
    activationDate: '2023-06-20',
    expirationDate: '2024-06-20',
    price: 200,
    status: computeStatus('2024-06-20'),
    hasSim: false,
    simOwnedBy: 'none'
  },

  // Client 2: Fatma (2 devices)
  {
    id: 4,
    clientId: 2,
    resellerId: 1,
    serialNumber: 'ACC-BOX-004-2024',
    model: 'ACCENT BOX',
    activationDate: '2024-02-01',
    expirationDate: '2025-02-01',
    price: 150,
    status: computeStatus('2025-02-01'),
    hasSim: true,
    simNumber: '216-22-888-999',
    simProvider: 'Tunisie Telecom',
    simOwnedBy: 'client'
  },
  {
    id: 5,
    clientId: 2,
    resellerId: 1,
    serialNumber: 'ACC-LITE-005-2024',
    model: 'ACCENT LITE',
    activationDate: '2024-04-10',
    expirationDate: '2025-04-10',
    price: 80,
    status: computeStatus('2025-04-10'),
    hasSim: false,
    simOwnedBy: 'none'
  },

  // Client 3: Mohamed (2 devices)
  {
    id: 6,
    clientId: 3,
    resellerId: 2,
    serialNumber: 'ACC-PRO-006-2024',
    model: 'ACCENT PRO',
    activationDate: '2024-01-05',
    expirationDate: '2025-01-05',
    price: 200,
    status: computeStatus('2025-01-05'),
    hasSim: true,
    simNumber: '216-54-111-222',
    simProvider: 'Ooredoo',
    simOwnedBy: 'reseller'
  },
  {
    id: 7,
    clientId: 3,
    resellerId: 2,
    serialNumber: 'ACC-MINI-007-2024',
    model: 'ACCENT MINI',
    activationDate: '2024-05-20',
    expirationDate: '2025-05-20',
    price: 100,
    status: computeStatus('2025-05-20'),
    hasSim: true,
    simNumber: '216-54-333-444',
    simProvider: 'Orange',
    simOwnedBy: 'client'
  },

  // Client 4: Salma (3 devices)
  {
    id: 8,
    clientId: 4,
    resellerId: 2,
    serialNumber: 'ACC-BOX-008-2023',
    model: 'ACCENT BOX',
    activationDate: '2023-08-15',
    expirationDate: '2024-08-15',
    price: 150,
    status: computeStatus('2024-08-15'),
    hasSim: true,
    simNumber: '216-98-555-666',
    simProvider: 'Tunisie Telecom',
    simOwnedBy: 'client'
  },
  {
    id: 9,
    clientId: 4,
    resellerId: 2,
    serialNumber: 'ACC-PRO-009-2024',
    model: 'ACCENT PRO',
    activationDate: '2024-02-10',
    expirationDate: '2025-02-10',
    price: 200,
    status: computeStatus('2025-02-10'),
    hasSim: false,
    simOwnedBy: 'none'
  },
  {
    id: 10,
    clientId: 4,
    resellerId: 2,
    serialNumber: 'ACC-LITE-010-2024',
    model: 'ACCENT LITE',
    activationDate: '2024-06-01',
    expirationDate: '2025-06-01',
    price: 80,
    status: computeStatus('2025-06-01'),
    hasSim: true,
    simNumber: '216-22-777-888',
    simProvider: 'Ooredoo',
    simOwnedBy: 'reseller'
  },

  // Client 5: Karim (2 devices)
  {
    id: 11,
    clientId: 5,
    resellerId: 3,
    serialNumber: 'ACC-MINI-011-2024',
    model: 'ACCENT MINI',
    activationDate: '2024-03-01',
    expirationDate: '2025-03-01',
    price: 100,
    status: computeStatus('2025-03-01'),
    hasSim: true,
    simNumber: '216-54-999-000',
    simProvider: 'Orange',
    simOwnedBy: 'client'
  },
  {
    id: 12,
    clientId: 5,
    resellerId: 3,
    serialNumber: 'ACC-BOX-012-2024',
    model: 'ACCENT BOX',
    activationDate: '2024-07-15',
    expirationDate: '2025-07-15',
    price: 150,
    status: computeStatus('2025-07-15'),
    hasSim: false,
    simOwnedBy: 'none'
  },

  // Client 6: Leila (2 devices)
  {
    id: 13,
    clientId: 6,
    resellerId: 3,
    serialNumber: 'ACC-PRO-013-2023',
    model: 'ACCENT PRO',
    activationDate: '2023-09-10',
    expirationDate: '2024-09-10',
    price: 200,
    status: computeStatus('2024-09-10'),
    hasSim: true,
    simNumber: '216-98-111-000',
    simProvider: 'Tunisie Telecom',
    simOwnedBy: 'reseller'
  },
  {
    id: 14,
    clientId: 6,
    resellerId: 3,
    serialNumber: 'ACC-LITE-014-2024',
    model: 'ACCENT LITE',
    activationDate: '2024-04-20',
    expirationDate: '2025-04-20',
    price: 80,
    status: computeStatus('2025-04-20'),
    hasSim: true,
    simNumber: '216-22-222-333',
    simProvider: 'Ooredoo',
    simOwnedBy: 'client'
  }
];

// Helper function to compute status based on expiration date
function computeStatus(expirationDate: string): 'active' | 'expired' {
  const today = new Date();
  const expiry = new Date(expirationDate);
  return today <= expiry ? 'active' : 'expired';
}
