import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reseller } from '../models/reseller.model';
import { Client } from '../models/client.model';
import { Device } from '../models/device.model';

@Injectable({ providedIn: 'root' })
export class ResellerService {
  private http = inject(HttpClient);
  
  // ✅ Admin operations go to /api/admin/resellers
  private adminUrl = 'http://localhost:8080/api/admin/resellers';
  
  // ✅ Public / portal operations go to /api/resellers
  private publicUrl = 'http://localhost:8080/api/resellers';
  private portalUrl = 'http://localhost:8080/api/reseller';

  // ── Admin scope ─────────────────────────────────────
  getAll() {
    return this.http.get<Reseller[]>(this.adminUrl);
  }

  getById(id: number) {
    return this.http.get<Reseller>(`${this.adminUrl}/${id}`);
  }

  getClientsByReseller(id: number) {
    return this.http.get<Client[]>(`${this.adminUrl}/${id}/clients`);
  }

  create(reseller: Partial<Reseller>) {
    return this.http.post<Reseller>(this.adminUrl, reseller);
  }

  update(id: number, reseller: Partial<Reseller>) {
    return this.http.put<Reseller>(`${this.adminUrl}/${id}`, reseller);
  }

  suspend(id: number) {
    return this.http.put<Reseller>(`${this.adminUrl}/${id}/suspend`, {});
  }

  reactivate(id: number) {
    return this.http.put<Reseller>(`${this.adminUrl}/${id}/reactivate`, {});
  }

  // ✅ Now uses adminUrl (which points to /api/admin/resellers)
  getReassignSuggestions(id: number) {
    return this.http.get<{ clients: any[]; resellers: any[] }>(`${this.adminUrl}/${id}/reassign-suggestions`);
  }

  // ── Public / portal endpoints ───────────────────────
  checkEmail(email: string) {
    return this.http.get<{ exists: boolean }>(
      `${this.publicUrl}/check-email`,
      { params: { email } }
    );
  }

  getCurrentMonthCommission(resellerId: number) {
    return this.http.get<{ commission: number }>(`${this.publicUrl}/${resellerId}/commission/current`);
  }

  getMyProfile() {
    return this.http.get<Reseller>(`${this.portalUrl}/profile`);
  }

  updateMyProfile(reseller: Partial<Reseller>) {
    return this.http.put<Reseller>(`${this.portalUrl}/profile`, reseller);
  }

  getMyDevices() {
    return this.http.get<Device[]>(`${this.portalUrl}/devices`);
  }

  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Reseller>(`${this.portalUrl}/upload-avatar`, formData);
  }

  getMyCommissions() {
    return this.http.get<any[]>(`${this.portalUrl}/commissions`);
  }

  getMyInvoices() {
    return this.http.get<any[]>(`${this.portalUrl}/invoices`);
  }
}