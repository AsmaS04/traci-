import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Device } from '../models/device.model';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private http = inject(HttpClient);
  private adminUrl = 'http://localhost:8080/api/admin/devices';

  getAll() {
    return this.http.get<Device[]>(this.adminUrl);
  }

  getById(id: number) {
    return this.http.get<Device>(`${this.adminUrl}/${id}`);
  }

  getByStatus(status: string) {
    return this.http.get<Device[]>(`${this.adminUrl}/status/${status}`);
  }

  create(device: Partial<Device>) {
    return this.http.post<Device>(this.adminUrl, device);
  }

  update(id: number, device: Partial<Device>) {
    return this.http.put<Device>(`${this.adminUrl}/${id}`, device);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}