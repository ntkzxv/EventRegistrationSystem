import { Component, EventEmitter, inject,Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
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
<<<<<<< HEAD
  @Output() loginClick = new EventEmitter<void>();

=======
  private readonly router = inject(Router);
>>>>>>> b453a5118d2c12bd7e21823bf198544358e990ed
  protected isUserMenuOpen = false;

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  onLoginClick() {
    this.loginClick.emit();
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.searchQueryChange.emit(value);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchQueryChange.emit('');
  }
  logout() {
  this.closeUserMenu();
  this.router.navigate(['/login']);
  }
}
