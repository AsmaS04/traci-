import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin';

  getDashboardStats() {
    return this.http.get<Record<string, any>>(`${this.apiUrl}/dashboard`);
  }

  getDeviceStatus() {
    return this.http.get<Record<string, any>>(`${this.apiUrl}/dashboard/device-status`);
  }

  getGrowthData() {
    return this.http.get<Record<string, any>>(`${this.apiUrl}/dashboard/growth`);
  }

  getResellerAnalytics() {
    return this.http.get<Record<string, any>>(`${this.apiUrl}/resellers/analytics`);
  }

  getClientAnalytics() {
    return this.http.get<Record<string, any>>(`${this.apiUrl}/clients/analytics`);
  }

  getDeviceAnalytics() {
    return this.http.get<Record<string, any>>(`${this.apiUrl}/devices/analytics`);
  }
}