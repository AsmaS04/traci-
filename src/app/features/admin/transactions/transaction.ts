import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../service/translation.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding:2rem;text-align:center;color:var(--text-secondary, #888);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 1rem;">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
      <h2>Transactions</h2>
      <p>Coming soon — backend not yet implemented.</p>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class Transactions {
  constructor(public i18n: TranslationService) {}
}