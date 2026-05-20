import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Client } from '../models/client.model';
import { Device } from '../models/device.model';

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

export interface PaiementDTO {
  idPay: number;
  payRef: string;
  idAbo: number;
  amount: number;
  paymentStatus: string;
  transactionId: string | null;
  createdAt: string;
  clientName: string;
  abonnementLabel: string;
}

export interface FactureDTO {
  id: number;
  invoiceNumber: string;
  clientId: number;
  invoiceDate: string;
  dueDate: string;
  amountUntaxed: number;
  taxAmount: number;
  total: number;
  status: string;
  serviceLabel: string;
  odooMoveId: number;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http            = inject(HttpClient);
  private adminUrl        = 'http://localhost:8080/api/admin/clients';
  private resellerUrl     = 'http://localhost:8080/api/reseller/clients';
  private clientPortalUrl = 'http://localhost:8080/api/client';

  // ── Admin scope ──────────────────────────────────────────────
  getAll()                                     { return this.http.get<Client[]>(this.adminUrl); }
  getById(id: number)                          { return this.http.get<Client>(`${this.adminUrl}/${id}`); }
  create(client: Partial<Client>)              { return this.http.post<Client>(this.adminUrl, client); }
  update(id: number, client: Partial<Client>)  { return this.http.put<Client>(`${this.adminUrl}/${id}`, client); }
  suspend(id: number)                          { return this.http.put<Client>(`${this.adminUrl}/${id}/suspend`, {}); }
  reactivate(id: number)                       { return this.http.put<Client>(`${this.adminUrl}/${id}/reactivate`, {}); }
  reassignClient(clientId: number, resellerId: number) {
    return this.http.put<Client>(`${this.adminUrl}/${clientId}/reassign`, null, {
      params: { resellerId: String(resellerId) }
    });
  }

  // ── Reseller scope ───────────────────────────────────────────
  getMyClients()                                        { return this.http.get<Client[]>(this.resellerUrl); }
  getMyClientById(id: number)                           { return this.http.get<Client>(`${this.resellerUrl}/${id}`); }
  createMyClient(client: Partial<Client>)               { return this.http.post<Client>(this.resellerUrl, client); }
  updateMyClient(id: number, client: Partial<Client>)   { return this.http.put<Client>(`${this.resellerUrl}/${id}`, client); }
  suspendMyClient(id: number)                           { return this.http.put<Client>(`${this.resellerUrl}/${id}/suspend`, {}); }
  reactivateMyClient(id: number)                        { return this.http.put<Client>(`${this.resellerUrl}/${id}/reactivate`, {}); }
  getMyClientDevices(id: number)                        { return this.http.get<Device[]>(`${this.resellerUrl}/${id}/devices`); }
  checkClientEmail(email: string) {
    return this.http.get<{ exists: boolean }>('http://localhost:8080/api/clients/check-email', { params: { email } });
  }

  // ── Client portal scope ──────────────────────────────────────
  getMyProfile()                               { return this.http.get<Client>(`${this.clientPortalUrl}/profile`); }
  updateMyProfile(clientData: Partial<Client>) { return this.http.put<Client>(`${this.clientPortalUrl}/profile`, clientData); }
  getMyDevices()                               { return this.http.get<Device[]>(`${this.clientPortalUrl}/devices`); }

  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Client>(`${this.clientPortalUrl}/upload-avatar`, formData);
  }

  getMyAbonnements() { return this.http.get<AbonnementDTO[]>(`${this.clientPortalUrl}/abonnements`); }

  getActiveAbonnement(): Observable<AbonnementDTO | null> {
    return this.http.get<AbonnementDTO>(`${this.clientPortalUrl}/abonnement/active`).pipe(
      catchError(err => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  renewAbonnement(dureeMois: number, prixUnitaire: number, nbDevices: number) {
    return this.http.post<AbonnementDTO>(`${this.clientPortalUrl}/abonnement/renew`, {
      dureeMois, prixUnitaire, nbDevices
    });
  }

  getMyFactures()  { return this.http.get<FactureDTO[]>('http://localhost:8080/api/invoices/my'); }
  getMyPayments()  { return this.http.get<PaiementDTO[]>(`${this.clientPortalUrl}/payments`); }

  initPayment(aboId: number, amount: number) {
    return this.http.post<PaiementDTO>(`${this.clientPortalUrl}/payment/init`, { aboId, amount });
  }

  confirmPayment(payRef: string, transactionId: string) {
    return this.http.post<PaiementDTO>(`${this.clientPortalUrl}/payment/confirm`, { payRef, transactionId });
  }

  // ── Grace period ─────────────────────────────────────────────
  activateGracePeriod(): Observable<Client> {
    return this.http.post<Client>(`${this.clientPortalUrl}/grace-period/activate`, {});
  }
}