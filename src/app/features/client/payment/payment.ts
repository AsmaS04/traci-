// src/app/features/client/payment/payment.ts

import { Component, EventEmitter, Output, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../service/translation.service';

type PaymentStep = 'method' | 'card' | 'success';
type PaymentMethod = 'visa' | 'mastercard' | 'paypal';

interface CardForm {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent {

  // Services
  i18n = inject(TranslationService);

  // Inputs
  @Input() amount: number = 0;
  @Input() serviceNom: string = '';
  @Input() dureeLabel: string = '';

  // Outputs
  @Output() close = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<any>();

  // Signals
  currentStep = signal<PaymentStep>('method');
  selectedMethod = signal<PaymentMethod | null>(null);
  isProcessing = signal(false);
  orderId = signal('');

  // Card form
  cardForm: CardForm = {
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  };

  // Payment methods
  paymentMethods = [
    { id: 'visa' as PaymentMethod, name: 'Visa', logo: 'visa' },
    { id: 'mastercard' as PaymentMethod, name: 'MasterCard', logo: 'mastercard' },
    { id: 'paypal' as PaymentMethod, name: 'PayPal', logo: 'paypal' }
  ];

  // Select payment method
  selectMethod(method: PaymentMethod) {
    this.selectedMethod.set(method);
  }

  // Go to card form
  continueToCard() {
    if (!this.selectedMethod()) {
      alert('Veuillez sélectionner une méthode de paiement');
      return;
    }
    this.currentStep.set('card');
  }

  // Go back to method selection
  goBackToMethod() {
    this.currentStep.set('method');
  }

  // Format card number
  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    this.cardForm.number = formattedValue.substring(0, 19); // Max 16 digits + 3 spaces
  }

  // Format expiry date
  formatExpiry(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.cardForm.expiry = value;
  }

  // Format CVV
  formatCVV(event: any) {
    this.cardForm.cvv = event.target.value.replace(/\D/g, '').substring(0, 3);
  }

  // Process payment
  processPayment() {
    // Validation
    if (!this.cardForm.number || !this.cardForm.expiry || !this.cardForm.cvv || !this.cardForm.name) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    this.isProcessing.set(true);

    // Simulate payment processing
    setTimeout(() => {
      // Generate order ID
      const orderId = 'DD' + new Date().getFullYear() + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      this.orderId.set(orderId);

      this.isProcessing.set(false);
      this.currentStep.set('success');

      // Emit success event
      this.paymentSuccess.emit({
        orderId: orderId,
        amount: this.amount,
        method: this.selectedMethod(),
        timestamp: new Date()
      });
    }, 2000);
  }

  // Close modal
  closeModal() {
    this.close.emit();
  }

  // Continue shopping (after success)
  continueShopping() {
    this.close.emit();
  }

  // Get masked card number
  getMaskedCardNumber(): string {
    const digits = this.cardForm.number.replace(/\s/g, '');
    if (digits.length < 4) return '•••• •••• •••• ••••';
    return '•••• •••• •••• ' + digits.slice(-4);
  }
}
