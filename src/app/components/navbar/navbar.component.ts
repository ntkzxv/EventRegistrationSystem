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
  @Output() loginClick = new EventEmitter<void>();
  private readonly router = inject(Router);
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
