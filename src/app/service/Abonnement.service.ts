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
}