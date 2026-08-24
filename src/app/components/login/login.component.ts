import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword =
    signal<boolean>(false);

  protected readonly errorMessage =
    signal<string>('');

  protected readonly isSubmitting =
    signal<boolean>(false);

  protected email = '';
  protected password = '';


  // ================= PASSWORD =================

  togglePassword() {
    this.showPassword.update(
      value => !value
    );
  }


  // ================= LOGIN =================

  login() {
    this.errorMessage.set('');

    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();

    if (!email || !password) {
      this.errorMessage.set(
        'กรุณากรอกอีเมลและรหัสผ่าน'
      );
      return;
    }

    if (!email.includes('@')) {
      this.errorMessage.set(
        'รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกอีเมลที่มี @'
      );
      return;
    }

    this.isSubmitting.set(true);

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);

        if (res.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/events']);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.error?.message ?? 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
        );
      },
    });
  }


  // ================= REGISTER =================

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
