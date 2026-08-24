import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRegistrationDto } from '../models/user.model';

const STORAGE_KEY = 'eventhub_users_data';

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-demo-1',
    fullName: 'สมชาย รักดี',
    email: 'somchai.r@email.com',
    phoneNumber: '081-234-5678',
    role: 'user',
    createdAt: '2024-11-01T10:00:00.000Z',
  },
];

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly usersSignal = signal<User[]>(this.loadInitialUsers());

  private loadInitialUsers(): User[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Could not read users from localStorage:', err);
      }
    }
    return DEFAULT_USERS;
  }

  private saveToStorage(users: User[]): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users, null, 2));
      } catch (err) {
        console.warn('Could not save users to localStorage:', err);
      }
    }
  }

  /**
   * Return Readonly Signal of users list
   */
  getUsers() {
    return this.usersSignal.asReadonly();
  }

  /**
   * Check if an email is already registered
   */
  checkEmailExists(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    return this.usersSignal().some((u) => u.email.trim().toLowerCase() === cleanEmail);
  }

  /**
   * Register a new user and prepare JSON entity
   */
  register(dto: UserRegistrationDto): { success: boolean; message: string; user?: User } {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanName = dto.fullName.trim();

    if (!cleanName) {
      return { success: false, message: 'กรุณากรอกชื่อ-นามสกุล' };
    }

    if (!cleanEmail) {
      return { success: false, message: 'กรุณากรอกอีเมล' };
    }

    if (!dto.password || dto.password.length < 6) {
      return { success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
    }

    if (dto.confirmPassword && dto.password !== dto.confirmPassword) {
      return { success: false, message: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน' };
    }

    if (this.checkEmailExists(cleanEmail)) {
      return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' };
    }

    const newUser: User = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: cleanName,
      email: cleanEmail,
      phoneNumber: dto.phoneNumber?.trim() || undefined,
      password: dto.password, // In future API backend, will be securely hashed
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...this.usersSignal(), newUser];
    this.usersSignal.set(updatedList);
    this.saveToStorage(updatedList);

    return {
      success: true,
      message: 'สมัครสมาชิกสำเร็จเรียบร้อยแล้ว',
      user: newUser,
    };
  }

  /**
   * Export all users formatted as a JSON string (for future JSON database or file export)
   */
  exportUsersAsJson(): string {
    return JSON.stringify(this.usersSignal(), null, 2);
  }

  /**
   * Import users from a JSON string or object
   */
  importUsersFromJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.usersSignal.set(parsed);
        this.saveToStorage(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
