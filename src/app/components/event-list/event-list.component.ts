import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
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

  setCategory(category: string) {
    this.selectedCategory.set(category);
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