import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, TransactionDTO, TransactionStats } from '../../../service/Admin.service';
import { TranslationService } from '../../../service/translation.service';

interface DateFilter {
  operator: 'equal' | 'before' | 'after' | 'between';
  from: string;
  to: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction.html',
  styleUrls: ['./transaction.css']
})
export class Transactions implements OnInit {
  private adminService = inject(AdminService);
  t = inject(TranslationService);

  all: TransactionDTO[] = [];
  filtered: TransactionDTO[] = [];
  stats: TransactionStats = { totalRevenue: 0, todayCount: 0, pendingCount: 0, totalCommissions: 0 };
  loading = false;

  selected: TransactionDTO | null = null;
  searchQuery = '';

  exportMenuOpen = false;

  // Pagination
  currentPage = 1;
  readonly pageSize = 15;
  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get paginated()  { const s = (this.currentPage - 1) * this.pageSize; return this.filtered.slice(s, s + this.pageSize); }
  goToPage(n: number) { if (n >= 1 && n <= this.totalPages) this.currentPage = n; }

  // Sort
  sortField = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';

  sort(field: string) {
    this.sortDir = this.sortField === field && this.sortDir === 'desc' ? 'asc' : 'desc';
    this.sortField = field;
    this.applySort();
  }

  sortIcon(field: string): string {
    if (this.sortField !== field) return 'ti-arrows-sort';
    return this.sortDir === 'asc' ? 'ti-arrow-up' : 'ti-arrow-down';
  }

  private applySort() {
    this.filtered = [...this.filtered].sort((a, b) => {
      const va = (a as any)[this.sortField] ?? '';
      const vb = (b as any)[this.sortField] ?? '';
      if (typeof va === 'number' && typeof vb === 'number')
        return this.sortDir === 'asc' ? va - vb : vb - va;
      return this.sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    this.currentPage = 1;
  }

  // Filters
  openDropdown: 'date' | 'status' | null = null;
  dateOperator: 'equal' | 'before' | 'after' | 'between' = 'equal';
  dateFrom = '';
  dateTo = '';
  pendingStatus = '';
  activeDateFilter: DateFilter | null = null;
  activeStatus = '';

  readonly STATUSES = ['PAID', 'PENDING', 'FAILED'];

  ngOnInit() {
    this.loadStats();
    this.load();
  }

  loadStats() {
    this.adminService.getTransactionStats().subscribe({
      next: s => {
        console.log('Transaction stats loaded:', s);
        this.stats = s;
      },
      error: err => console.error('Failed to load stats', err)
    });
  }

  load() {
    this.loading = true;
    const params: Record<string, string> = {};

    if (this.activeStatus) {
      const dbStatus = this.activeStatus === 'PAID' ? 'completed'
                     : this.activeStatus === 'PENDING' ? 'pending'
                     : 'failed';
      params['status'] = dbStatus;
    }

    if (this.activeDateFilter) {
      const { operator, from, to } = this.activeDateFilter;
      switch (operator) {
        case 'equal':   params['from'] = from; params['to'] = from; break;
        case 'before':  params['to']   = from; break;
        case 'after':   params['from'] = from; break;
        case 'between': params['from'] = from; params['to'] = to; break;
      }
    }

    console.log('Loading transactions with params:', params);
    this.adminService.getTransactions(params).subscribe({
      next: txs => {
        console.log('Transactions received:', txs);
        this.all = txs;
        this.applySearch();
        this.loading = false;
      },
      error: err => {
        console.error('Failed to load transactions', err);
        this.loading = false;
      }
    });
  }

  applySearch() {
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      this.filtered = this.all.filter(t =>
        (t.clientName?.toLowerCase().includes(q) ||
         t.resellerName?.toLowerCase().includes(q))
      );
    } else {
      this.filtered = [...this.all];
    }
    this.applySort();
  }

  onSearch() { this.currentPage = 1; this.applySearch(); }

  toggle(name: 'date' | 'status', e: MouseEvent) {
    e.stopPropagation();
    if (this.openDropdown === name) { this.openDropdown = null; return; }
    if (name === 'status') this.pendingStatus = this.activeStatus;
    if (name === 'date' && this.activeDateFilter) {
      this.dateOperator = this.activeDateFilter.operator;
      this.dateFrom = this.activeDateFilter.from;
      this.dateTo   = this.activeDateFilter.to;
    }
    this.openDropdown = name;
  }

  toggleExportMenu(event: MouseEvent) {
    event.stopPropagation();
    this.exportMenuOpen = !this.exportMenuOpen;
  }

  stop(e: MouseEvent) { e.stopPropagation(); }

  @HostListener('document:click')
  closeAll() {
    this.openDropdown = null;
    this.exportMenuOpen = false;
  }

  applyDate() {
    if (!this.dateFrom) return;
    this.activeDateFilter = { operator: this.dateOperator, from: this.dateFrom, to: this.dateTo };
    this.openDropdown = null;
    this.load();
  }

  clearDate(e?: MouseEvent) {
    e?.stopPropagation();
    this.activeDateFilter = null;
    this.dateFrom = ''; this.dateTo = ''; this.dateOperator = 'equal';
    this.load();
  }

  applyStatus() {
    this.activeStatus = this.pendingStatus;
    this.openDropdown = null;
    this.load();
  }

  clearStatus(e?: MouseEvent) {
    e?.stopPropagation();
    this.activeStatus = ''; this.pendingStatus = '';
    this.load();
  }

  get hasFilter() { return !!(this.activeDateFilter || this.activeStatus || this.searchQuery.trim()); }

  clearAll() {
    this.activeDateFilter = null;
    this.activeStatus = ''; this.pendingStatus = '';
    this.dateFrom = ''; this.dateTo = ''; this.dateOperator = 'equal';
    this.searchQuery = '';
    this.load();
  }

  dateChipLabel(): string {
    if (!this.activeDateFilter) return '';
    const { operator, from, to } = this.activeDateFilter;
    const fmt = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-GB',
      { day: '2-digit', month: 'short', year: 'numeric' });
    if (operator === 'equal')   return fmt(from);
    if (operator === 'before')  return `before ${fmt(from)}`;
    if (operator === 'after')   return `after ${fmt(from)}`;
    if (operator === 'between') return `${fmt(from)} – ${fmt(to)}`;
    return fmt(from);
  }

  getDisplayStatus(status: string): string {
    if (!status) return 'UNKNOWN';
    if (status === 'completed') return 'PAID';
    if (status === 'pending') return 'PENDING';
    if (status === 'failed') return 'FAILED';
    return status.toUpperCase();
  }

  statusColor(s: string): string {
    const display = this.getDisplayStatus(s);
    switch (display) {
      case 'PAID':    return 'green';
      case 'PENDING': return 'orange';
      case 'FAILED':  return 'red';
      default:        return 'gray';
    }
  }

  openModal(tx: TransactionDTO) { this.selected = tx; }
  closeModal() { this.selected = null; }

  exportCSV() {
    this.exportMenuOpen = false;
    const headers = ['ID', 'Client', 'Reseller', 'Amount (DT)', 'Commission (DT)', 'Status', 'Date'];
    const rows = this.filtered.map(t => [
      t.id,
      `"${t.clientName ?? ''}"`,
      `"${t.resellerName ?? ''}"`,
      t.amount?.toFixed(2) ?? '0.00',
      t.commission?.toFixed(2) ?? '—',
      this.getDisplayStatus(t.paymentStatus),
      t.createdAt
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  exportExcel() {
    this.exportMenuOpen = false;
    const headers = ['ID', 'Client', 'Reseller', 'Amount (DT)', 'Commission (DT)', 'Status', 'Date'];
    const rows = this.filtered.map(t => [
      t.id,
      `"${t.clientName ?? ''}"`,
      `"${t.resellerName ?? ''}"`,
      t.amount?.toFixed(2) ?? '0.00',
      t.commission?.toFixed(2) ?? '—',
      this.getDisplayStatus(t.paymentStatus),
      t.createdAt
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
  }

  exportPDF() {
    this.exportMenuOpen = false;
    const originalTitle = document.title;
    document.title = 'Transactions Report';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
  }

  formatAmount(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toFixed(2) + ' DT';
  }

  formatDate(s: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatTime(s: string): string {
    if (!s) return '';
    return new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}