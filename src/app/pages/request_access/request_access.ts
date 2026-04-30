import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../service/translation.service';

@Component({
  selector: 'app-request-access',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './request_access.html',
  styleUrl: './request_access.css',
})
export default class RequestAccess implements OnInit {
  email   = '';
  role    = 'CLIENT';
  loading = false;
  success = false;
  error   = '';

  // Email check state
  emailChecking = false;
  emailValid: boolean | null = null;  // null = unchecked, true = exists, false = not found

  private baseUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public ts: TranslationService
  ) {}

  ngOnInit() {
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    if (roleParam === 'RESELLER' || roleParam === 'CLIENT') {
      this.role = roleParam;
    }
  }

  isValidEmailFormat(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  // Called on (blur) from the email input
  onEmailBlur() {
    if (!this.isValidEmailFormat()) {
      this.emailValid = null;
      return;
    }
    this.checkEmailExists();
  }

  // Reset check when user types again
  onEmailInput() {
    this.emailValid = null;
    this.error = '';
  }

  checkEmailExists() {
    this.emailChecking = true;
    this.emailValid    = null;
    this.error         = '';

    this.http.get<{ exists: boolean }>(
      `${this.baseUrl}/auth/check-email`,
      { params: { email: this.email, role: this.role } }
    ).subscribe({
      next: (res) => {
        this.emailChecking = false;
        this.emailValid    = res.exists;
        if (!res.exists) {
          this.error = `No account found for "${this.email}" as a ${this.role.toLowerCase()}. Please check your email or contact your manager.`;
        }
      },
      error: () => {
        // If endpoint doesn't exist yet, fall through silently
        this.emailChecking = false;
        this.emailValid    = true;
      }
    });
  }

  get canSubmit(): boolean {
    return !this.loading && !this.emailChecking && !!this.email && this.emailValid !== false;
  }

  onSubmit() {
    this.error = '';

    if (!this.isValidEmailFormat()) {
      this.error = this.ts.t('ra_error_email');
      return;
    }

    if (this.emailValid === false) {
      this.error = `No account found for "${this.email}".`;
      return;
    }

    // If unchecked (user didn't blur), check first then submit
    if (this.emailValid === null) {
      this.emailChecking = true;
      this.http.get<{ exists: boolean }>(
        `${this.baseUrl}/auth/check-email`,
        { params: { email: this.email, role: this.role } }
      ).subscribe({
        next: (res) => {
          this.emailChecking = false;
          this.emailValid    = res.exists;
          if (!res.exists) {
            this.error = `No account found for "${this.email}" as a ${this.role.toLowerCase()}. Please check your email or contact your manager.`;
          } else {
            this.sendRequest();
          }
        },
        error: () => {
          this.emailChecking = false;
          this.sendRequest();   // fallback: proceed if endpoint not yet implemented
        }
      });
      return;
    }

    this.sendRequest();
  }

  private sendRequest() {
    this.loading = true;
    this.http.post(`${this.baseUrl}/auth/request-access`, {
      email: this.email,
      role:  this.role
    }).subscribe({
      next:  () => { this.success = true; this.loading = false; },
      error: () => { this.success = true; this.loading = false; }
    });
  }
}