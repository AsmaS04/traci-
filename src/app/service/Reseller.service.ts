import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reseller } from '../models/reseller.model';
import { Client } from '../models/client.model';
import { Device } from '../models/device.model';

@Injectable({ providedIn: 'root' })
export class ResellerService {
  private http = inject(HttpClient);
  private adminUrl = 'http://localhost:8080/api/admin/resellers';
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

  getReassignSuggestions(id: number) {
    return this.http.get<{ clients: any[]; resellers: any[] }>(`${this.adminUrl}/${id}/reassign-suggestions`);
  }

 checkEmail(email: string) {
  return this.http.get<{ exists: boolean }>(
    `http://localhost:8080/api/resellers/check-email`,
    { params: { email } }
  );
}
  // ── Reseller portal scope ───────────────────────────
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

    return this.http.post<Reseller>(
      `${this.portalUrl}/upload-avatar`,
      formData
    );
  }
}