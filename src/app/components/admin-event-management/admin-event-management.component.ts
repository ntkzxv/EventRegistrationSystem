import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';

import { NavbarComponent } from '../navbar/navbar.component';
import { API_BASE_URL } from '../../core/api.constants';
import { formatThaiDate, parseThaiDateToIsoRange } from '../../core/thai-date';
import {
  ApiEventListResponse,
  ApiEventSummary,
  ApiEventType,
  ApiVenue,
} from '../../models/api.model';

export interface RegistrantItem {
  id: string;
  name: string;
  email: string;
  registeredDate: string;
  status: 'ยืนยันแล้ว' | 'รอดำเนินการ' | 'ยกเลิกแล้ว';
}

export interface AdminEventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  registeredCount: number;
  capacity: number;
  status: 'เปิดรับ' | 'ปิดรับ' | 'เต็ม';
  registrants: RegistrantItem[];
}

interface ApiRegistrantItem {
  id: number;
  user: { name: string; email: string } | null;
  status: 'confirmed' | 'cancelled';
  registered_at: string;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

function mapAdminEvent(api: ApiEventSummary): AdminEventItem {
  const status: AdminEventItem['status'] =
    api.status === 'closed' ? 'ปิดรับ' : api.seats_remaining <= 0 ? 'เต็ม' : 'เปิดรับ';

  return {
    id: String(api.id),
    title: api.name,
    date: formatThaiDate(api.start_date),
    location: api.venue?.name ?? '',
    category: api.event_type?.name ?? '',
    registeredCount: Math.max(0, api.max_seats - api.seats_remaining),
    capacity: api.max_seats,
    status,
    registrants: [],
  };
}

@Component({
  selector: 'app-admin-event-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-event-management.component.html',
  styleUrls: ['./admin-event-management.component.css'],
})
export class AdminEventManagementComponent {
  private readonly http = inject(HttpClient);

  // Navigation active tab
  protected readonly activeTab = signal<'events' | 'dashboard'>('events');

  // Expanded event ID
  protected readonly expandedEventId = signal<string | null>(null);

  // Search and filter
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCategory = signal<string>('ทุกหมวดหมู่');
  protected readonly isUserMenuOpen = signal<boolean>(false);

  // Modal State for Add / Edit Event
  protected readonly isEventModalOpen = signal<boolean>(false);
  protected readonly modalMode = signal<'add' | 'edit'>('add');
  protected readonly editingEventId = signal<string | null>(null);

  // Modal Form Inputs
  protected readonly formTitle = signal<string>('');
  protected readonly formDate = signal<string>('');
  protected readonly formLocation = signal<string>('');
  protected readonly formCategory = signal<string>('เทคโนโลยี');
  protected readonly formCapacity = signal<number>(100);
  protected readonly formStatus = signal<'เปิดรับ' | 'ปิดรับ' | 'เต็ม'>('เปิดรับ');

  // Toast State
  protected readonly toast = signal<ToastState>({
    show: false,
    type: 'info',
    message: '',
  });

  // Events dataset (จาก backend)
  protected readonly events = signal<AdminEventItem[]>([]);

  // Lookup tables สำหรับแปลงชื่อ <-> id ตอนบันทึกฟอร์ม
  private readonly venues = signal<ApiVenue[]>([]);
  private readonly eventTypes = signal<ApiEventType[]>([]);

  // Filtered Events Computed Signal
  protected readonly filteredEvents = computed(() => {
    const list = this.events();
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    return list.filter((item) => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesCat = cat === 'ทุกหมวดหมู่' || item.category === cat;

      return matchesQuery && matchesCat;
    });
  });

  constructor(private router: Router) {
    this.loadEvents();
    this.loadLookups();
  }

  private loadEvents() {
    this.http.get<ApiEventListResponse>(`${API_BASE_URL}/events`).subscribe((res) => {
      this.events.set(res.data.map(mapAdminEvent));

      // ถ้ามีแถวที่เปิดดูรายชื่อผู้ลงทะเบียนอยู่ ให้โหลดใหม่ (ไม่งั้นจะโดนล้างว่างไปตอน events reload)
      const expandedId = this.expandedEventId();
      if (expandedId) {
        this.loadRegistrants(expandedId);
      }
    });
  }

  private loadLookups() {
    this.http
      .get<{ data: ApiVenue[] }>(`${API_BASE_URL}/admin/venues`)
      .subscribe((res) => this.venues.set(res.data));

    this.http
      .get<{ data: ApiEventType[] }>(`${API_BASE_URL}/admin/event-types`)
      .subscribe((res) => this.eventTypes.set(res.data));
  }

  private loadRegistrants(eventId: string) {
    this.http
      .get<{ data: ApiRegistrantItem[] }>(`${API_BASE_URL}/admin/events/${eventId}/registrants`)
      .subscribe((res) => {
        const registrants: RegistrantItem[] = res.data.map((r) => ({
          id: String(r.id),
          name: r.user?.name ?? '',
          email: r.user?.email ?? '',
          registeredDate: formatThaiDate(r.registered_at),
          status: r.status === 'confirmed' ? 'ยืนยันแล้ว' : 'ยกเลิกแล้ว',
        }));

        this.events.update((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, registrants } : e))
        );
      });
  }

  toggleExpand(eventId: string) {
    if (this.expandedEventId() === eventId) {
      this.expandedEventId.set(null);
      return;
    }

    this.expandedEventId.set(eventId);
    this.loadRegistrants(eventId);
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  openAddEventModal() {
    this.modalMode.set('add');
    this.editingEventId.set(null);
    this.formTitle.set('');
    this.formDate.set('');
    this.formLocation.set('');
    this.formCategory.set('เทคโนโลยี');
    this.formCapacity.set(100);
    this.formStatus.set('เปิดรับ');
    this.isEventModalOpen.set(true);
  }

  openEditEventModal(event: AdminEventItem, evt: Event) {
    evt.stopPropagation();
    this.modalMode.set('edit');
    this.editingEventId.set(event.id);
    this.formTitle.set(event.title);
    this.formDate.set(event.date);
    this.formLocation.set(event.location);
    this.formCategory.set(event.category);
    this.formCapacity.set(event.capacity);
    this.formStatus.set(event.status);
    this.isEventModalOpen.set(true);
  }

  closeEventModal() {
    this.isEventModalOpen.set(false);
  }

  saveEvent() {
    if (!this.formTitle() || !this.formDate() || !this.formLocation()) {
      this.showToast('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const range = parseThaiDateToIsoRange(this.formDate());

    if (!range) {
      this.showToast('error', 'รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้รูปแบบ เช่น 24 พ.ย. 2024');
      return;
    }

    this.resolveVenueId(this.formLocation()).subscribe((venueId) => {
      const payload = {
        name: this.formTitle(),
        event_type_id: this.resolveEventTypeId(this.formCategory()),
        venue_id: venueId,
        start_date: range.start,
        end_date: range.end,
        max_seats: Number(this.formCapacity()),
        status: this.formStatus() === 'ปิดรับ' ? 'closed' : 'open',
      };

      if (this.modalMode() === 'add') {
        this.http.post(`${API_BASE_URL}/admin/events`, payload).subscribe({
          next: () => {
            this.loadEvents();
            this.showToast('success', `เพิ่มกิจกรรม "${payload.name}" สำเร็จ`);
            this.closeEventModal();
          },
          error: () => this.showToast('error', 'เพิ่มกิจกรรมไม่สำเร็จ'),
        });
      } else {
        const eventId = this.editingEventId();

        this.http.put(`${API_BASE_URL}/admin/events/${eventId}`, payload).subscribe({
          next: () => {
            this.loadEvents();
            this.showToast('success', 'บันทึกการแก้ไขกิจกรรมเรียบร้อย');
            this.closeEventModal();
          },
          error: () => this.showToast('error', 'บันทึกการแก้ไขไม่สำเร็จ'),
        });
      }
    });
  }

  private resolveVenueId(name: string): Observable<number> {
    const trimmed = name.trim();
    const existing = this.venues().find((v) => v.name.trim() === trimmed);

    if (existing) {
      return of(existing.id);
    }

    return this.http
      .post<ApiVenue>(`${API_BASE_URL}/admin/venues`, { name: trimmed, address: '', capacity: 0 })
      .pipe(
        tap((venue) => this.venues.update((prev) => [...prev, venue])),
        map((venue) => venue.id)
      );
  }

  private resolveEventTypeId(name: string): number {
    return (
      this.eventTypes().find((t) => t.name === name)?.id ??
      this.eventTypes()[0]?.id ??
      1
    );
  }

  toggleEventStatus(event: AdminEventItem, evt: Event) {
    evt.stopPropagation();
    const newStatus = event.status === 'ปิดรับ' ? 'open' : 'closed';

    this.http
      .patch(`${API_BASE_URL}/admin/events/${event.id}/status`, { status: newStatus })
      .subscribe(() => {
        this.loadEvents();
        this.showToast(
          'info',
          `เปลี่ยนสถานะกิจกรรม "${event.title}" เป็น "${newStatus === 'open' ? 'เปิดรับ' : 'ปิดรับ'}" แล้ว`
        );
      });
  }

  private showToast(type: 'success' | 'error' | 'info', message: string) {
    this.toast.set({ show: true, type, message });
    setTimeout(() => {
      this.toast.update((curr) => ({ ...curr, show: false }));
    }, 4000);
  }
}
