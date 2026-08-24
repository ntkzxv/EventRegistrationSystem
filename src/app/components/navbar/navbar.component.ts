import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  @Input() mode: 'user' | 'admin' = 'user';
  @Input() activeTab: string = '';
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.getCurrentUser();

  protected isUserMenuOpen = false;

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.closeUserMenu();
    this.router.navigate(['/login']);
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.searchQueryChange.emit(value);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchQueryChange.emit('');
  }
}
