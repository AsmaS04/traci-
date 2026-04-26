import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../service/Toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast-item" [class]="'toast-item--' + t.type" (click)="toast.dismiss(t.id)">
          <span class="toast-icon">
            @if (t.type === 'success') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            }
            @if (t.type === 'error') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            }
            @if (t.type === 'warning') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            }
            @if (t.type === 'info') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      pointer-events: none;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1rem 0.75rem 0.85rem;
      border-radius: 12px;
      min-width: 280px;
      max-width: 400px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
      cursor: pointer;
      pointer-events: all;
      animation: toast-in 0.28s cubic-bezier(0.34,1.56,0.64,1);
      font-family: 'Manrope', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      border: 1px solid;
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateX(60px) scale(0.92); }
      to   { opacity: 1; transform: translateX(0)   scale(1); }
    }

    .toast-item--success { background: #f0fdf4; color: #15803d; border-color: rgba(22,163,74,0.25); }
    .toast-item--error   { background: #fef2f2; color: #b91c1c; border-color: rgba(220,38,38,0.25); }
    .toast-item--warning { background: #fffbeb; color: #b45309; border-color: rgba(217,119,6,0.25); }
    .toast-item--info    { background: #eff6ff; color: #1d4ed8; border-color: rgba(59,130,246,0.25); }

    .toast-icon { display: flex; align-items: center; flex-shrink: 0; }
    .toast-icon svg { width: 16px; height: 16px; }

    .toast-msg  { flex: 1; line-height: 1.35; }

    .toast-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: currentColor;
      opacity: 0.5;
      font-size: 0.7rem;
      padding: 2px 4px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
}