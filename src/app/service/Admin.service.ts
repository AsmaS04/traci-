import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemEventDTO {
  id: number;
  type: string;
  label: string;
  detail: string;
  role: string;
  createdAt: string;
}

export interface TransactionDTO {
  id: number;
  payRef: string;
  clientName: string;
  resellerName: string;
  amount: number;
  commission: number | null;
  paymentStatus: string; // PAID | PENDING | FAILED
  createdAt: string;
}

export interface TransactionStats {
  totalRevenue: number;
  todayCount: number;
  pendingCount: number;
  totalCommissions: number;
}

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

  getEvents(): Observable<SystemEventDTO[]> {
    return this.http.get<SystemEventDTO[]>('http://localhost:8080/api/events');
  }

  getFilteredEvents(params: Record<string, string>): Observable<SystemEventDTO[]> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) httpParams = httpParams.set(k, v);
    });
    return this.http.get<SystemEventDTO[]>('http://localhost:8080/api/events', { params: httpParams });
  }

  getRevenueStats() {
    return this.http.get<{ currentMonth: number; previousMonth: number; allTime: number }>(
      `${this.apiUrl}/revenue/stats`
    );
  }

  getRevenueByReseller() {
    return this.http.get<{ name: string; amount: number; pct: number }[]>(
      `${this.apiUrl}/revenue/by-reseller`
    );
  }

  private txUrl = 'http://localhost:8080/api/transactions';

  getTransactions(params?: Record<string, string>): Observable<TransactionDTO[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) httpParams = httpParams.set(k, v);
      });
    }
    return this.http.get<TransactionDTO[]>(this.txUrl, { params: httpParams });
  }

  getTransactionStats(): Observable<TransactionStats> {
    return this.http.get<TransactionStats>(`${this.txUrl}/stats`);
  }
}