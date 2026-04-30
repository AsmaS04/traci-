import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AbonnementDTO {
  idAbo: number;
  clientId: number;
  clientName: string;
  dureeMois: number;
  nbDevices: number;
  prixUnitaire: number;
  startDate: string;
  endDate: string;
  totalTtc: number;
  status: string;
  createdAt: string;
  joursRestants: number;
  dureeLabel: string;
}

export interface AssignDeviceRequest {
  resellerId: number;
  clientId:   number;
  deviceId:   number;
  dureeMois:  number;
  prixUnitaire: number;
}

@Injectable({ providedIn: 'root' })
export class AbonnementService {
  private http    = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/abonnements';

  getByClient(clientId: number): Observable<AbonnementDTO[]> {
    return this.http.get<AbonnementDTO[]>(`${this.baseUrl}/client/${clientId}`);
  }

  getActiveByClient(clientId: number): Observable<AbonnementDTO> {
    return this.http.get<AbonnementDTO>(`${this.baseUrl}/client/${clientId}/active`);
  }

  assignDevice(
    resellerId:   number,
    clientId:     number,
    deviceId:     number,
    dureeMois:    number,
    prixUnitaire: number
  ): Observable<AbonnementDTO> {
    const body: AssignDeviceRequest = { resellerId, clientId, deviceId, dureeMois, prixUnitaire };
    return this.http.post<AbonnementDTO>(`${this.baseUrl}/assign`, body);
  }
}