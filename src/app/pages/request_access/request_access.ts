import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../service/translation.service';

@Component({
  selector: 'app-request-access',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './request_access.html',
  styleUrl: './request_access.css',
})
export default class RequestAccess implements OnInit {
  email = '';
  role = 'CLIENT';
  loading = false;
  success = false;
  error = '';

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

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  onSubmit() {
    this.error = '';

    if (!this.isValidEmail()) {
      this.error = this.ts.t('ra_error_email');
      return;
    }

    this.loading = true;

    this.http.post('http://localhost:8080/api/auth/request-access', {
      email: this.email,
      role: this.role
    }).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: () => {
        this.success = true;
        this.loading = false;
      }
    });
  }
}