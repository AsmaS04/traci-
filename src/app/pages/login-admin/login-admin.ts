import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../service/Auth.service';
import { TranslationService } from '../../service/translation.service';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login-admin.html',
  styleUrl: './login-admin.css',
})
export class LoginAdmin {
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
        if (role === 'ROLE_ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.error = this.ts.t('login_error_admin');
          this.authService.clearSession();
        }
        this.loading = false;
      },
      error: () => {
        this.error   = this.ts.t('login_error_credentials');
        this.loading = false;
      }
    });
  }
}