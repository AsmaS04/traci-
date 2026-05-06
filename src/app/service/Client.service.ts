import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);
  private adminUrl = 'http://localhost:8080/api/admin/clients';
  private resellerUrl = 'http://localhost:8080/api/reseller/clients';
  private clientPortalUrl = 'http://localhost:8080/api/client';

  // ── Admin scope ─────────────────────────────────────
  getAll() {
    return this.http.get<Client[]>(this.adminUrl);
  }

  getById(id: number) {
    return this.http.get<Client>(`${this.adminUrl}/${id}`);
  }

  create(client: Partial<Client>) {
    return this.http.post<Client>(this.adminUrl, client);
  }

  update(id: number, client: Partial<Client>) {
    return this.http.put<Client>(`${this.adminUrl}/${id}`, client);
  }

  // ── Reseller scope ──────────────────────────────────
  getMyClients() {
    return this.http.get<Client[]>(this.resellerUrl);
  }

  getMyClientById(id: number) {
    return this.http.get<Client>(`${this.resellerUrl}/${id}`);
  }

  createMyClient(client: Partial<Client>) {
    return this.http.post<Client>(this.resellerUrl, client);
  }

  updateMyClient(id: number, client: Partial<Client>) {
    return this.http.put<Client>(`${this.resellerUrl}/${id}`, client);
  }

  getMyClientDevices(id: number) {
    return this.http.get<Device[]>(`${this.resellerUrl}/${id}/devices`);
  }

  checkClientEmail(email: string) {
  return this.http.get<{ exists: boolean }>(
    'http://localhost:8080/api/clients/check-email',
    { params: { email } }
  );
}

  // ── Client portal scope ─────────────────────────────
  getMyProfile() {
    return this.http.get<Client>(`${this.clientPortalUrl}/profile`);
  }

  getMyDevices() {
    return this.http.get<Device[]>(`${this.clientPortalUrl}/devices`);
  }

  // ── Abonnements ─────────────────────────────────────
  getMyAbonnements() {
    return this.http.get<AbonnementDTO[]>(`${this.clientPortalUrl}/abonnements`);
  }

  getActiveAbonnement() {
    return this.http.get<AbonnementDTO>(`${this.clientPortalUrl}/abonnement/active`);
  }

  renewAbonnement(dureeMois: number, prixUnitaire: number, nbDevices: number) {
    return this.http.post<AbonnementDTO>(`${this.clientPortalUrl}/abonnement/renew`, {
      dureeMois, prixUnitaire, nbDevices
    });
  }

  // ── Payments ────────────────────────────────────────
  getMyPayments() {
    return this.http.get<PaiementDTO[]>(`${this.clientPortalUrl}/payments`);
  }

  initPayment(aboId: number, amount: number) {
    return this.http.post<PaiementDTO>(`${this.clientPortalUrl}/payment/init`, {
      aboId, amount
    });
  }

  confirmPayment(payRef: string, transactionId: string) {
    return this.http.post<PaiementDTO>(`${this.clientPortalUrl}/payment/confirm`, {
      payRef, transactionId
    });
  }
}