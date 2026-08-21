import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

  protected isUserMenuOpen = false;

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
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
