import { Component, computed, effect, inject, signal } from '@angular/core';
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

  // เอาไว้ใช้เฉพาะ derive รายชื่อหมวดหมู่สำหรับปุ่มกรอง (ไม่ใช่ข้อมูลที่แสดงจริง)
  protected readonly categories = computed(() => {
    const names = this.eventService.getEvents()().map((event) => event.category);
    return ['ทั้งหมด', ...Array.from(new Set(names))];
  });

  // รายการกิจกรรมของหน้าปัจจุบัน (มาจาก backend แบบแบ่งหน้าจริง)
  protected readonly paginatedEvents = signal<Event[]>([]);
  private readonly totalCount = signal<number>(0);

  // ใน template ใช้แค่ .length เพื่อแสดงจำนวนรวม — ค่านี้มาจาก backend โดยตรงแล้ว
  protected readonly filteredEvents = computed(
    () => Array.from({ length: this.totalCount() }) as Event[]
  );

  protected readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.totalCount() / size));
  });

  protected readonly startIndex = computed(() => {
    if (this.totalCount() === 0) return 0;
    const size = Math.max(1, this.pageSize());
    return (this.currentPage() - 1) * size + 1;
  });

  protected readonly endIndex = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.min(this.currentPage() * size, this.totalCount());
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

  constructor() {
    // ดึงข้อมูลใหม่จาก backend ทุกครั้งที่ search/หมวดหมู่/หน้า/ขนาดหน้าเปลี่ยน
    effect(() => {
      const search = this.searchQuery().trim();
      const category = this.selectedCategory();
      const page = this.currentPage();
      const pageSize = this.pageSize();

      const typeId =
        category === 'ทั้งหมด' ? undefined : this.eventService.getEventTypeIdByName(category);

      this.eventService
        .searchEvents({ search: search || undefined, type: typeId, page, page_size: pageSize })
        .subscribe((res) => {
          this.paginatedEvents.set(res.data);
          this.totalCount.set(res.total);
        });
    });
  }

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
