import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Device } from '../models/device.model';
import { Observable } from 'rxjs';

export interface AssignDeviceRequest {
  resellerId: number;
  clientId:   number;
  deviceId:   number;
  dureeMois:  number;
  prixUnitaire: number;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private http    = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/devices';
  private aboUrl  = 'http://localhost:8080/api/abonnements';

  getAll(): Observable<Device[]> {
    return this.http.get<Device[]>(this.baseUrl);
  }

  getById(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.baseUrl}/${id}`);
  }

  getByStatus(status: string): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/status/${status}`);
  }

  /** All devices allocated to a reseller (all statuses) */
  getByReseller(resellerId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/reseller/${resellerId}`);
  }

  /** Only libre devices allocated to a reseller */
  getLibreByReseller(resellerId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/reseller/${resellerId}/libre`);
  }

  getByClient(clientId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/client/${clientId}`);
  }

  create(device: Partial<Device>): Observable<Device> {
    return this.http.post<Device>(this.baseUrl, device);
  }

  update(id: number, device: Partial<Device>): Observable<Device> {
    return this.http.put<Device>(`${this.baseUrl}/${id}`, device);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Assign a libre device to a client — creates Abonnement + activates device */
  assignDevice(req: AssignDeviceRequest): Observable<any> {
    return this.http.post(`${this.aboUrl}/assign`, req);
  }
  /** Count total devices linked to a reseller (all statuses) */
  countByReseller(resellerId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/reseller/${resellerId}/count`);
  }
}