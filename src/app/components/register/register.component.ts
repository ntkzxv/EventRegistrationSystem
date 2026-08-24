import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

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
    this.router.navigate(['/login']);
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

    if (!this.password || this.password.length < 8) {
      this.errorMessage = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน';
      return;
    }

    this.isLoading = true;

    const name = this.fullName.trim();
    const email = this.email.trim().toLowerCase();
    const password = this.password;

    this.authService.register(name, email, password).subscribe({
      next: (user) => {
        this.registeredJsonData = JSON.stringify(user, null, 2);

        // Auto-login session for user convenience
        this.authService.login(email, password).subscribe({
          next: () => {
            this.isLoading = false;
            this.successMessage = 'สมัครสมาชิกสำเร็จเรียบร้อยแล้ว';
            this.isSuccessModalOpen = true;
            this.cdr.markForCheck();
          },
          error: () => {
            // สมัครสำเร็จแต่ auto-login ไม่สำเร็จ ก็ยังถือว่าสมัครผ่าน ให้ไปหน้า login เอง
            this.isLoading = false;
            this.successMessage = 'สมัครสมาชิกสำเร็จเรียบร้อยแล้ว';
            this.isSuccessModalOpen = true;
            this.cdr.markForCheck();
          },
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message ?? 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
        this.cdr.markForCheck();
      },
    });
  }

  copyJson(): void {
    if (this.registeredJsonData && navigator?.clipboard) {
      navigator.clipboard.writeText(this.registeredJsonData).then(() => {
        this.isCopied = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.isCopied = false;
          this.cdr.markForCheck();
        }, 2500);
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
