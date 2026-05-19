export interface Device {
  idDevice: number;
  numDevice: string;
  clientId: number | null;
  clientName: string | null;
  imei: string;
  model: string;
  status: string;
  dateActivation: string | null;
  createdAt: string;
    simProvider?: string;   // ← add this

  customName?: string;
  

}