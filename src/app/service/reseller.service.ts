// src/app/services/reseller.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reseller } from '../models/reseller.model';
import { ResellerClient } from '../data/reseller-mock-data';

@Injectable({ providedIn: 'root' })
export class ResellerService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/resellers`;

  /**
   * GET /api/resellers
   * Get all resellers
   */
  getAllResellers(): Observable<Reseller[]> {
    return this.http.get<Reseller[]>(this.apiUrl);
  }

  /**
   * GET /api/resellers/{id}
   * Get reseller by ID
   */
  getResellerById(id: number): Observable<Reseller> {
    return this.http.get<Reseller>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/resellers/{id}/clients
   * Get all clients for a specific reseller (detailed view)
   * Returns ResellerClient[] with full details
   */
  getResellerClients(resellerId: number): Observable<ResellerClient[]> {
    return this.http.get<ResellerClient[]>(`${this.apiUrl}/${resellerId}/clients`);
  }

  /**
   * GET /api/resellers/username/{username}
   * Get reseller by username
   */
  getResellerByUsername(username: string): Observable<Reseller> {
    return this.http.get<Reseller>(`${this.apiUrl}/username/${username}`);
  }

  /**
   * POST /api/resellers
   * Create new reseller
   */
  createReseller(reseller: Partial<Reseller>): Observable<Reseller> {
    return this.http.post<Reseller>(this.apiUrl, reseller);
  }

  /**
   * PUT /api/resellers/{id}
   * Update reseller
   */
  updateReseller(id: number, reseller: Partial<Reseller>): Observable<Reseller> {
    return this.http.put<Reseller>(`${this.apiUrl}/${id}`, reseller);
  }

  /**
   * DELETE /api/resellers/{id}
   * Delete reseller
   */
  deleteReseller(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/resellers/check-username/{username}
   * Check if username exists
   */
  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check-username/${username}`);
  }
}