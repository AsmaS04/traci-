import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../service/Auth.service';
import { TranslationService } from '../../service/translation.service';

@Component({
  selector: 'app-login-reseller',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login-reseller.html',
  styleUrl: './login-reseller.css',
})
export class LoginReseller {
  username     = '';
  password     = '';
  error        = '';
  loading      = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public ts: TranslationService
  ) {}

  onSubmit() {
    this.error   = '';
    this.loading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        const role = this.authService.getRole();
        if (role === 'ROLE_RESELLER') {
          this.router.navigate(['/reseller-dashboard/dashboard']);
        } else {
          this.error = this.ts.t('login_error_reseller_credentials');
          this.authService.clearSession();
        }
        this.loading = false;
      },
      error: (err) => {
        // ✅ Use backend error message if available (plain string), else fallback to translation
        const backendMessage = err.error;
        if (backendMessage && typeof backendMessage === 'string') {
          this.error = backendMessage;
        } else {
          this.error = this.ts.t('login_error_reseller_credentials');
        }
        this.loading = false;
      }
    });
  }
}