import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DeviceRequestDTO {
  id: number;
  resellerId: number;
  resellerName: string;
  requestedCount: number;
  fulfilledCount: number | null;
  status: 'PENDING' | 'FULFILLED' | 'REJECTED';
  message: string;
  createdAt: string;
  fulfilledAt: string | null;
  unassignedAvailable: number;
}

@Injectable({ providedIn: 'root' })
export class DeviceRequestService {
  private http = inject(HttpClient);
  private url  = 'http://localhost:8080/api/device-requests';

  // Reseller: create request
  createRequest(resellerId: number, count: number, message: string): Observable<DeviceRequestDTO> {
    return this.http.post<DeviceRequestDTO>(this.url, { resellerId, count, message });
  }

  // Reseller: own history
  getMyRequests(resellerId: number): Observable<DeviceRequestDTO[]> {
    return this.http.get<DeviceRequestDTO[]>(`${this.url}/reseller/${resellerId}`);
  }

  // Admin: all requests
  getAllRequests(): Observable<DeviceRequestDTO[]> {
    return this.http.get<DeviceRequestDTO[]>(this.url);
  }

  // Admin: pending only
  getPendingRequests(): Observable<DeviceRequestDTO[]> {
    return this.http.get<DeviceRequestDTO[]>(`${this.url}/pending`);
  }

  // Admin: fulfill
  fulfill(id: number, count: number): Observable<DeviceRequestDTO> {
    return this.http.put<DeviceRequestDTO>(`${this.url}/${id}/fulfill`, { count });
  }

  // Admin: reject
  reject(id: number): Observable<DeviceRequestDTO> {
    return this.http.put<DeviceRequestDTO>(`${this.url}/${id}/reject`, {});
  }
}