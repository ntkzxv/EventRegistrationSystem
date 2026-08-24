import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {

  private readonly router = inject(Router);

  protected readonly showPassword =
    signal<boolean>(false);

  protected readonly errorMessage =
    signal<string>('');

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

  const user = this.mockUsers.find(
    user => user.email.toLowerCase() === email
  );

  if (!user) {
    this.errorMessage.set(
      'ไม่พบอีเมลนี้ในระบบ'
    );
    return;
  }

  if (user.password !== password) {
    this.errorMessage.set(
      'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
    );
    return;
  }

  if (user.role === 'ADMIN') {
    this.router.navigate(['/admin-dashboard']);
  } else {
    this.router.navigate(['/events']);
  }
  }
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

  // ================= REGISTER =================

  goToRegister() {
    this.router.navigate(['/register']);
  }
}