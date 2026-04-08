import { ClientDevice, DeviceTransaction } from '../models/device.model';

// ── Helper: compute status from today ────────────────────────
function computeStatus(expirationDate: string): 'active' | 'expired' {
  return new Date(expirationDate) > new Date() ? 'active' : 'expired';
}

export const MOCK_DEVICES: ClientDevice[] = [
  { id:1,  clientId:1, resellerId:1, serialNumber:'ACC-BOX-001-2024',  model:'ACCENT BOX',  activationDate:'2024-01-10', expirationDate:'2025-01-10', price:450, status:computeStatus('2025-01-10'), hasSim:true,  simNumber:'89216 0100 1234 567', simProvider:'Ooredoo',         simOwnedBy:'reseller' },
  { id:2,  clientId:1, resellerId:1, serialNumber:'ACC-MINI-002-2024', model:'ACCENT MINI', activationDate:'2024-03-15', expirationDate:'2025-03-15', price:320, status:computeStatus('2025-03-15'), hasSim:true,  simNumber:'89216 0100 2345 678', simProvider:'Tunisie Telecom', simOwnedBy:'client'   },
  { id:3,  clientId:1, resellerId:1, serialNumber:'ACC-PRO-003-2023',  model:'ACCENT PRO',  activationDate:'2023-06-01', expirationDate:'2024-06-01', price:580, status:computeStatus('2024-06-01'), hasSim:false, simNumber:null,                  simProvider:'none',            simOwnedBy:'none'     },
  { id:4,  clientId:2, resellerId:1, serialNumber:'ACC-BOX-004-2024',  model:'ACCENT BOX',  activationDate:'2024-04-01', expirationDate:'2025-04-01', price:450, status:computeStatus('2025-04-01'), hasSim:true,  simNumber:'89216 0200 3456 789', simProvider:'Orange',          simOwnedBy:'reseller' },
  { id:5,  clientId:2, resellerId:1, serialNumber:'ACC-LITE-005-2024', model:'ACCENT LITE', activationDate:'2024-04-01', expirationDate:'2025-04-01', price:220, status:computeStatus('2025-04-01'), hasSim:false, simNumber:null,                  simProvider:'none',            simOwnedBy:'none'     },
  { id:6,  clientId:3, resellerId:1, serialNumber:'ACC-PRO-006-2024',  model:'ACCENT PRO',  activationDate:'2024-02-20', expirationDate:'2025-02-20', price:580, status:computeStatus('2025-02-20'), hasSim:true,  simNumber:'89216 0300 4567 890', simProvider:'Ooredoo',         simOwnedBy:'reseller' },
  { id:7,  clientId:3, resellerId:1, serialNumber:'ACC-MINI-007-2023', model:'ACCENT MINI', activationDate:'2023-09-01', expirationDate:'2024-09-01', price:320, status:computeStatus('2024-09-01'), hasSim:true,  simNumber:'89216 0300 5678 901', simProvider:'Tunisie Telecom', simOwnedBy:'client'   },
  { id:8,  clientId:4, resellerId:1, serialNumber:'ACC-BOX-008-2024',  model:'ACCENT BOX',  activationDate:'2024-07-10', expirationDate:'2025-07-10', price:450, status:computeStatus('2025-07-10'), hasSim:true,  simNumber:'89216 0400 6789 012', simProvider:'Orange',          simOwnedBy:'reseller' },
  { id:9,  clientId:4, resellerId:1, serialNumber:'ACC-BOX-009-2023',  model:'ACCENT BOX',  activationDate:'2023-07-10', expirationDate:'2024-07-10', price:450, status:computeStatus('2024-07-10'), hasSim:false, simNumber:null,                  simProvider:'none',            simOwnedBy:'none'     },
  { id:10, clientId:5, resellerId:1, serialNumber:'ACC-PRO-010-2024',  model:'ACCENT PRO',  activationDate:'2024-09-01', expirationDate:'2025-09-01', price:580, status:computeStatus('2025-09-01'), hasSim:true,  simNumber:'89216 0500 7890 123', simProvider:'Ooredoo',         simOwnedBy:'reseller' },
  { id:11, clientId:5, resellerId:1, serialNumber:'ACC-MINI-011-2024', model:'ACCENT MINI', activationDate:'2024-09-01', expirationDate:'2025-09-01', price:320, status:computeStatus('2025-09-01'), hasSim:true,  simNumber:'89216 0500 8901 234', simProvider:'Ooredoo',         simOwnedBy:'reseller' },
  { id:12, clientId:5, resellerId:1, serialNumber:'ACC-LITE-012-2024', model:'ACCENT LITE', activationDate:'2024-09-15', expirationDate:'2025-09-15', price:220, status:computeStatus('2025-09-15'), hasSim:false, simNumber:null,                  simProvider:'none',            simOwnedBy:'none'     },
  { id:13, clientId:6, resellerId:1, serialNumber:'ACC-BOX-013-2024',  model:'ACCENT BOX',  activationDate:'2024-05-20', expirationDate:'2025-05-20', price:450, status:computeStatus('2025-05-20'), hasSim:true,  simNumber:'89216 0600 9012 345', simProvider:'Tunisie Telecom', simOwnedBy:'client'   },
  { id:14, clientId:6, resellerId:1, serialNumber:'ACC-MINI-014-2024', model:'ACCENT MINI', activationDate:'2024-08-01', expirationDate:'2025-08-01', price:320, status:computeStatus('2025-08-01'), hasSim:false, simNumber:null,                  simProvider:'none',            simOwnedBy:'none'     },
];

export const MOCK_DEVICE_TRANSACTIONS: DeviceTransaction[] = [
  { id:1,  deviceId:1,  clientId:1, resellerId:1, serial:'ACC-BOX-001-2024',  model:'ACCENT BOX',  type:'device_sale', amount:450, date:'2024-01-10', notes:'Initial setup for Elyes Mansouri'  },
  { id:2,  deviceId:2,  clientId:1, resellerId:1, serial:'ACC-MINI-002-2024', model:'ACCENT MINI', type:'device_sale', amount:320, date:'2024-03-15', notes:'Second vehicle added'               },
  { id:3,  deviceId:3,  clientId:1, resellerId:1, serial:'ACC-PRO-003-2023',  model:'ACCENT PRO',  type:'device_sale', amount:580, date:'2023-06-01', notes:'Expired — needs renewal'            },
  { id:4,  deviceId:3,  clientId:1, resellerId:1, serial:'ACC-PRO-003-2023',  model:'ACCENT PRO',  type:'renewal',     amount:80,  date:'2024-06-05', notes:'Annual renewal attempt (partial)'   },
  { id:5,  deviceId:4,  clientId:2, resellerId:1, serial:'ACC-BOX-004-2024',  model:'ACCENT BOX',  type:'device_sale', amount:450, date:'2024-04-01', notes:''                                   },
  { id:6,  deviceId:5,  clientId:2, resellerId:1, serial:'ACC-LITE-005-2024', model:'ACCENT LITE', type:'device_sale', amount:220, date:'2024-04-01', notes:'Lite for small vehicle'             },
  { id:7,  deviceId:6,  clientId:3, resellerId:1, serial:'ACC-PRO-006-2024',  model:'ACCENT PRO',  type:'device_sale', amount:580, date:'2024-02-20', notes:'Fleet management upgrade'           },
  { id:8,  deviceId:7,  clientId:3, resellerId:1, serial:'ACC-MINI-007-2023', model:'ACCENT MINI', type:'device_sale', amount:320, date:'2023-09-01', notes:'Expired device'                    },
  { id:9,  deviceId:8,  clientId:4, resellerId:1, serial:'ACC-BOX-008-2024',  model:'ACCENT BOX',  type:'device_sale', amount:450, date:'2024-07-10', notes:''                                   },
  { id:10, deviceId:9,  clientId:4, resellerId:1, serial:'ACC-BOX-009-2023',  model:'ACCENT BOX',  type:'device_sale', amount:450, date:'2023-07-10', notes:'Previous year device'              },
  { id:11, deviceId:10, clientId:5, resellerId:1, serial:'ACC-PRO-010-2024',  model:'ACCENT PRO',  type:'device_sale', amount:580, date:'2024-09-01', notes:'3-device package for Ferchichi'    },
  { id:12, deviceId:11, clientId:5, resellerId:1, serial:'ACC-MINI-011-2024', model:'ACCENT MINI', type:'device_sale', amount:320, date:'2024-09-01', notes:''                                   },
  { id:13, deviceId:12, clientId:5, resellerId:1, serial:'ACC-LITE-012-2024', model:'ACCENT LITE', type:'device_sale', amount:220, date:'2024-09-15', notes:''                                   },
  { id:14, deviceId:13, clientId:6, resellerId:1, serial:'ACC-BOX-013-2024',  model:'ACCENT BOX',  type:'device_sale', amount:450, date:'2024-05-20', notes:''                                   },
  { id:15, deviceId:14, clientId:6, resellerId:1, serial:'ACC-MINI-014-2024', model:'ACCENT MINI', type:'device_sale', amount:320, date:'2024-08-01', notes:'Device inactive — SIM issue'       },
];
