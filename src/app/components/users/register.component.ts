import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Register Form Model
  fullName: string = '';
  email: string = '';
  phoneNumber: string = '';
  password: string = '';
  confirmPassword: string = '';

  // UI States
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // JSON Preview & Modal
  isSuccessModalOpen: boolean = false;
  registeredJsonData: string = '';
  isCopied: boolean = false;

  onLoginClick(): void {
    // Plain button without action
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Basic Validation
    if (!this.fullName.trim()) {
      this.errorMessage = 'กรุณาระบุชื่อ-นามสกุล';
      return;
    }

    if (!this.email.trim()) {
      this.errorMessage = 'กรุณาระบุอีเมล';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      return;
    }

    if (!this.password || this.password.length < 6) {
      this.errorMessage = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน';
      return;
    }

    this.isLoading = true;

    // Simulate slight async delay for smooth UI feedback
    setTimeout(() => {
      const result = this.userService.register({
        fullName: this.fullName,
        email: this.email,
        phoneNumber: this.phoneNumber,
        password: this.password,
        confirmPassword: this.confirmPassword,
      });

      this.isLoading = false;

      if (!result.success) {
        this.errorMessage = result.message;
        return;
      }

      // Auto-login session for user convenience
      this.authService.login(this.email.trim());

      // Prepare JSON payload preview for developer & user inspection
      this.registeredJsonData = JSON.stringify(result.user, null, 2);
      this.successMessage = result.message;
      this.isSuccessModalOpen = true;
    }, 400);
  }

  copyJson(): void {
    if (this.registeredJsonData && navigator?.clipboard) {
      navigator.clipboard.writeText(this.registeredJsonData).then(() => {
        this.isCopied = true;
        setTimeout(() => (this.isCopied = false), 2500);
      });
    }
  }

  closeModal(): void {
    this.isSuccessModalOpen = false;
    this.resetRegisterForm();
    this.router.navigate(['/events']);
  }

  goToEvents(): void {
    this.isSuccessModalOpen = false;
    this.router.navigate(['/events']);
  }

  private resetRegisterForm(): void {
    this.fullName = '';
    this.email = '';
    this.phoneNumber = '';
    this.password = '';
    this.confirmPassword = '';
    this.errorMessage = '';
  }
}
