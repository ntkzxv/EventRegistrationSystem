import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css'],
})
export class EventListComponent {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCategory = signal<string>('ทั้งหมด');
  protected readonly pageSize = signal<number>(6);
  protected readonly currentPage = signal<number>(1);

  readonly pageSizeOptions = [6, 12, 24, 48];

  protected readonly events = this.eventService.getEvents();

  protected readonly categories = computed(() => {
    const categories = this.events().map(
      event => event.category
    );

    return [
      'ทั้งหมด',
      ...Array.from(new Set(categories))
    ];
  });

  protected readonly filteredEvents = computed(() => {
    const query =
      this.searchQuery().trim().toLowerCase();

    const category =
      this.selectedCategory();

    return this.events().filter(event => {
      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query);

      const matchesCategory =
        category === 'ทั้งหมด' ||
        event.category === category;

      return matchesSearch && matchesCategory;
    });
  });

  protected readonly totalPages = computed(() => {
    const total = this.filteredEvents().length;
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(total / size));
  });

  protected readonly paginatedEvents = computed(() => {
    const events = this.filteredEvents();
    const size = Math.max(1, this.pageSize());
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * size;
    return events.slice(start, start + size);
  });

  protected readonly startIndex = computed(() => {
    if (this.filteredEvents().length === 0) return 0;
    const size = Math.max(1, this.pageSize());
    const page = Math.min(this.currentPage(), this.totalPages());
    return (page - 1) * size + 1;
  });

  protected readonly endIndex = computed(() => {
    const size = Math.max(1, this.pageSize());
    const page = Math.min(this.currentPage(), this.totalPages());
    return Math.min(page * size, this.filteredEvents().length);
  });

  protected readonly pageNumbers = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];

    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    pages.push(total);
    return pages;
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  setCategory(category: string) {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  onPageSizeChange(size: number | string | null | undefined) {
    if (size === null || size === undefined || size === '' || Number(size) < 6) {
      this.pageSize.set(6);
    } else {
      this.pageSize.set(Math.floor(Number(size)));
    }
    this.currentPage.set(1);
  }

  setPage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  getCategoryColor(category: string): string {
    if (category === 'ทั้งหมด') {
      return '#2563EB';
    }

    return this.eventService.getCategoryColor(category);
  }

  getAvailableSeats(event: Event): number {
    return Math.max(
      0,
      event.capacity - event.registeredCount
    );
  }

  isFull(event: Event): boolean {
    return event.registeredCount >= event.capacity;
  }

  openEventDetail(event: Event) {
    this.router.navigate(['/events', event.id]);
  }
}