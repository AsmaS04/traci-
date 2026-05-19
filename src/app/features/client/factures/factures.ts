import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../../service/translation.service';
import { ToastService } from '../../../service/Toast.service';
import { ClientService, FactureDTO } from '../../../service/Client.service';

type FilterStatut = 'ALL' | 'PAID' | 'PENDING';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factures.html',
  styleUrl: './factures.css'
})
export default class FacturesComponent implements OnInit {

  i18n          = inject(TranslationService);
  private toast  = inject(ToastService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);
  private clientService = inject(ClientService);

  factures         = signal<FactureDTO[]>([]);
  loading          = signal(true);
  selectedFacture  = signal<FactureDTO | null>(null);
  showDetailsModal = signal(false);
  filterStatut     = signal<FilterStatut>('ALL');

  private statusMap(s: string): 'PAID' | 'PENDING' {
    if (s === 'paid')   return 'PAID';
    if (s === 'posted') return 'PENDING';
    return 'PENDING';
  }

  filteredFactures = computed(() => {
    const filter = this.filterStatut();
    const all    = this.factures();
    if (filter === 'ALL') return all;
    return all.filter(f => this.statusMap(f.status) === filter);
  });

  facturesStats = computed(() => {
    const all = this.factures();
    return {
      total:        all.length,
      montantTotal: all.reduce((s, f) => s + (f.total ?? 0), 0),
      payees:       all.filter(f => f.status === 'paid').length,
      enAttente:    all.filter(f => f.status === 'posted').length
    };
  });

  ngOnInit() {
    this.handleStripeReturn();
    this.loadFactures();
  }

  private loadFactures() {
    this.loading.set(true);
    this.clientService.getMyFactures().subscribe({
      next: (data) => {
        console.log('Invoices received:', data);
        this.factures.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load invoices:', err);
        this.toast.error('Failed to load invoices.');
        this.loading.set(false);
      }
    });
  }

  private handleStripeReturn() {
    const status = this.route.snapshot.queryParamMap.get('payment');
    if (status === 'success') {
      this.toast.success('Payment confirmed — subscription renewed and invoice sent by email.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.loadFactures();
    }
  }

  setFilter(s: FilterStatut)               { this.filterStatut.set(s); }
  isFilterActive(s: FilterStatut): boolean { return this.filterStatut() === s; }

  openDetails(f: FactureDTO)  { this.selectedFacture.set(f); this.showDetailsModal.set(true); }
  closeDetails()              { this.showDetailsModal.set(false); this.selectedFacture.set(null); }

  telechargerFacture(f: FactureDTO) {
    if (!f.odooMoveId) {
      this.toast.warning('No PDF available for this invoice.');
      return;
    }
    this.http.get(`http://localhost:8080/api/invoices/${f.odooMoveId}/pdf`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${f.invoiceNumber || f.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toast.success(`Downloading ${a.download}...`);
      },
      error: () => {
        this.toast.error('Failed to download PDF. Please try again later.');
      }
    });
  }

  statusBadgeClass(s: string): string {
    if (s === 'paid')   return 'badge--paid';
    if (s === 'posted') return 'badge--pending';
    return 'badge--overdue';
  }

  statusLabel(s: string): string {
    if (s === 'paid')   return 'Paid';
    if (s === 'posted') return 'Pending';
    return s;
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}