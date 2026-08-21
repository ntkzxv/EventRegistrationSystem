import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly isLoggedIn = signal<boolean>(false);
  private readonly currentUser = signal<{ email: string } | null>(null);

  getAuthStatus() {
    return this.isLoggedIn.asReadonly();
  }

  getCurrentUser() {
    return this.currentUser.asReadonly();
  }

  login(email: string) {
    // Mock login
    this.isLoggedIn.set(true);
    this.currentUser.set({ email });
  }

  logout() {
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }
}
