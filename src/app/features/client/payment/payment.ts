import { Component, EventEmitter, Output, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loadStripe } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../../service/translation.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent {
  t = inject(TranslationService);
  constructor(private http: HttpClient) {}

  @Input() amount: number = 0;
  @Input() serviceNom: string = '';
  @Input() dureeLabel: string = '';
  @Input() clientId: number = 0;
  @Input() factureId: number = 0;

  @Output() close = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<any>();

  isProcessing = signal(false);

  async pay() {
    this.isProcessing.set(true);

    const stripe = await loadStripe('pk_test_51TUmvOAdm9DoANgJsAktoNNpKzQS9sCyMzIA40UFj3CWYPjkC4UBA9Uj35QJJLaW53lc9qtxik41ZOqwE7kblfqy007Qqtj77m');
    if (!stripe) { this.isProcessing.set(false); return; }

    this.http.post<any>('http://localhost:8080/api/payment/create-checkout-session', {
      amount:      this.amount,
      productName: this.serviceNom,
      clientId:    this.clientId,
      factureId:   this.factureId
    }).subscribe({
      next: async (response) => {
        const result = await stripe.redirectToCheckout({ sessionId: response.sessionId });
        if (result.error) { this.isProcessing.set(false); }
      },
      error: () => { this.isProcessing.set(false); }
    });
  }

  closeModal() { this.close.emit(); }
}