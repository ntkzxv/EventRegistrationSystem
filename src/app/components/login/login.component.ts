import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
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
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  protected readonly showPassword = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  protected email = '';
  protected password = '';

  private readonly mockUsers = [
    {
      email: 'somchai.r@email.com',
      password: '12345678',
      role: 'USER'
    },
    {
      email: 'admin@eventhub.com',
      password: 'admin123',
      role: 'ADMIN'
    }
  ];

  // ================= PASSWORD =================
  togglePassword() {
    this.showPassword.update(value => !value);
  }

  // ================= LOGIN =================
  login() {
    this.errorMessage.set('');

    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();

    if (!email || !password) {
      this.errorMessage.set('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    if (!email.includes('@')) {
      this.errorMessage.set('รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกอีเมลที่มี @');
      return;
    }

    // 1. Check registered users in UserService (localStorage)
    const registeredUser = this.userService.getUsers()().find(
      u => u.email.trim().toLowerCase() === email
    );

    if (registeredUser) {
      if (registeredUser.password && registeredUser.password !== password) {
        this.errorMessage.set('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        return;
      }
      this.authService.login(email);
      if (registeredUser.role?.toUpperCase() === 'ADMIN') {
        this.router.navigate(['/admin-dashboard']);
      } else {
        this.router.navigate(['/events']);
      }
      return;
    }

    // 2. Check predefined mock users
    const mockUser = this.mockUsers.find(
      user => user.email.toLowerCase() === email
    );

    if (!mockUser) {
      this.errorMessage.set('ไม่พบอีเมลนี้ในระบบ');
      return;
    }

    if (mockUser.password !== password) {
      this.errorMessage.set('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }

    this.authService.login(email);

    if (mockUser.role === 'ADMIN') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/events']);
    }
  }

  // ================= REGISTER =================
  goToRegister() {
    this.router.navigate(['/register']);
  }
}