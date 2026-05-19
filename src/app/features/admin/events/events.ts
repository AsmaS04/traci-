import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemEventDTO } from '../../../service/Admin.service';
import { TranslationService } from '../../../service/translation.service';

interface DateFilter {
  operator: 'equal' | 'before' | 'after' | 'between';
  from: string;
  to: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.html',
  styleUrls: ['./events.css']
})
export class EventsComponent implements OnInit {
  private adminService = inject(AdminService);
  t = inject(TranslationService);

  events: SystemEventDTO[] = [];
  loading = false;

  openDropdown: 'date' | 'action' | 'role' | null = null;

  dateOperator: 'equal' | 'before' | 'after' | 'between' = 'equal';
  dateFrom = '';
  dateTo = '';
  pendingAction = '';
  pendingRole = '';

  activeDateFilter: DateFilter | null = null;
  activeAction = '';
  activeRole = '';

  currentPage = 1;
  readonly pageSize = 20;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.events.length / this.pageSize));
  }

  get paginatedEvents(): SystemEventDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.events.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  // UPDATED: removed unwanted types, added RESELLER_SUSPENDED
  readonly EVENT_TYPES = [
    'NEW_CLIENT', 'NEW_RESELLER', 'UPDATE_RESELLER',
    'UPDATE_CLIENT', 'DEVICE_ASSIGNED', 'NEW_PAYMENT',
    'NEW_DEVICE_REQUEST', 'ACCESS_REQUEST', 'RESELLER_SUSPENDED'
  ];

  readonly ROLES = ['ADMIN', 'RESELLER', 'CLIENT'];

  ngOnInit() { this.load(); }

  // ── Load ──────────────────────────────────────────────────

  load() {
    this.loading = true;
    const hasFilter = this.activeDateFilter || this.activeAction || this.activeRole;

    if (!hasFilter) {
      this.adminService.getEvents().subscribe({
        next: e => { this.events = e; this.currentPage = 1; this.loading = false; },
        error: () => { this.loading = false; }
      });
      return;
    }

    const params: Record<string, string> = {};
    if (this.activeAction) params['type'] = this.activeAction;
    if (this.activeRole)   params['role'] = this.activeRole;

    if (this.activeDateFilter) {
      const { operator, from, to } = this.activeDateFilter;
      switch (operator) {
        case 'equal':   params['from'] = from; params['to'] = from; break;
        case 'before':  params['to']   = from;                      break;
        case 'after':   params['from'] = from;                      break;
        case 'between': params['from'] = from; params['to'] = to;   break;
      }
    }

    this.adminService.getFilteredEvents(params).subscribe({
      next: e => { this.events = e; this.currentPage = 1; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  // ── Dropdown ──────────────────────────────────────────────

  toggle(name: 'date' | 'action' | 'role', e: MouseEvent) {
    e.stopPropagation();
    if (this.openDropdown === name) { this.openDropdown = null; return; }
    if (name === 'action') this.pendingAction = this.activeAction;
    if (name === 'role')   this.pendingRole   = this.activeRole;
    if (name === 'date' && this.activeDateFilter) {
      this.dateOperator = this.activeDateFilter.operator;
      this.dateFrom     = this.activeDateFilter.from;
      this.dateTo       = this.activeDateFilter.to;
    }
    this.openDropdown = name;
  }

  stop(e: MouseEvent) { e.stopPropagation(); }

  @HostListener('document:click')
  closeAll() { this.openDropdown = null; }

  // ── Date ──────────────────────────────────────────────────

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

  // ── Action ────────────────────────────────────────────────

  applyAction() {
    this.activeAction = this.pendingAction;
    this.openDropdown = null;
    this.load();
  }

  clearAction(e?: MouseEvent) {
    e?.stopPropagation();
    this.activeAction = ''; this.pendingAction = '';
    this.load();
  }

  // ── Role ──────────────────────────────────────────────────

  applyRole() {
    this.activeRole = this.pendingRole;
    this.openDropdown = null;
    this.load();
  }

  clearRole(e?: MouseEvent) {
    e?.stopPropagation();
    this.activeRole = ''; this.pendingRole = '';
    this.load();
  }

  // ── Clear all ─────────────────────────────────────────────

  get hasFilter() { return !!(this.activeDateFilter || this.activeAction || this.activeRole); }

  clearAll() {
    this.activeDateFilter = null;
    this.activeAction = ''; this.activeRole = '';
    this.dateFrom = ''; this.dateTo = ''; this.dateOperator = 'equal';
    this.pendingAction = ''; this.pendingRole = '';
    this.load();
  }

  // ── Display helpers ───────────────────────────────────────

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

  // UPDATED: color mapping (removed references to deleted types, added RESELLER_SUSPENDED)
  color(type: string): string {
    if (['NEW_CLIENT','NEW_RESELLER','NEW_PAYMENT'].includes(type))               return 'green';
    if (['DEVICE_ASSIGNED','NEW_DEVICE_REQUEST','RESELLER_SUSPENDED'].includes(type)) return 'orange';
    if (['ACCESS_REQUEST'].includes(type))                                        return 'purple';
    if (['UPDATE_CLIENT','UPDATE_RESELLER'].includes(type))                       return 'blue';
    return 'gray';
  }

  roleClass(role: string | null | undefined): string {
    if (!role) return 'unknown';
    return role.toLowerCase();
  }

  roleLabel(role: string | null | undefined): string {
    if (!role) return '—';
    return this.t.t('role_' + role);
  }

  formatTime(s: string): string {
    return new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  fmtDate(s: string): string {
    return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}