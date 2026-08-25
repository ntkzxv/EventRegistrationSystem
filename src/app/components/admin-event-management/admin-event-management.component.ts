import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { NavbarComponent } from '../navbar/navbar.component';
import { API_BASE_URL } from '../../core/api.constants';
import { formatThaiDate, formatThaiTime, parseThaiDateToIsoRange } from '../../core/thai-date';
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
  description: string;
  date: string;
  startDate?: string;
  endDate?: string;
  location: string;
  locationAddress: string;
  category: string;
  registeredCount: number;
  capacity: number;
  status: 'เปิดรับ' | 'ปิดรับ' | 'เต็ม';
  organizerName: string;
  organizerContactEmail: string;
  organizerContactPhone: string;
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
    api.status === 'closed' ? 'ปิดรับ' : (api.status === 'full' || api.seats_remaining <= 0) ? 'เต็ม' : 'เปิดรับ';

  return {
    id: String(api.id),
    title: api.name,
    description: api.description || '',
    date: formatThaiDate(api.start_date),
    startDate: api.start_date,
    endDate: api.end_date,
    location: api.venue?.name ?? '',
    locationAddress: api.venue?.address ?? '',
    category: api.event_type?.name ?? '',
    registeredCount: Math.max(0, api.max_seats - api.seats_remaining),
    capacity: api.max_seats,
    status,
    organizerName: api.organizer_name || '',
    organizerContactEmail: api.organizer_contact_email || '',
    organizerContactPhone: api.organizer_contact_phone || '',
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

  // 3-Dots Action Menu Active Event ID
  protected readonly activeMenuEventId = signal<string | null>(null);

  // Search and filter
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCategory = signal<string>('ทุกหมวดหมู่');
  protected readonly selectedStatus = signal<string>('ทุกสถานะ');
  protected readonly pageSize = signal<number>(5);
  protected readonly currentPage = signal<number>(1);
  protected readonly isUserMenuOpen = signal<boolean>(false);

  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly statusOptions = ['ทุกสถานะ', 'เปิดรับ', 'ปิดรับ', 'เต็ม'];

  // Modal State for Add / Edit Event
  protected readonly isEventModalOpen = signal<boolean>(false);
  protected readonly modalMode = signal<'add' | 'edit'>('add');
  protected readonly editingEventId = signal<string | null>(null);
  protected readonly modalStep = signal<1 | 2>(1);

  // Modal State for Delete Event
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly eventToDelete = signal<AdminEventItem | null>(null);

  // Modal Form Inputs
  protected readonly formTitle = signal<string>('');
  protected readonly formDescription = signal<string>('');
  protected readonly formDate = signal<string>('');
  protected readonly formStartTime = signal<string>('09:00');
  protected readonly formEndTime = signal<string>('17:00');
  protected readonly formLocation = signal<string>('');
  protected readonly formLocationAddress = signal<string>('');
  protected readonly formCategory = signal<string>('เทคโนโลยี');
  protected readonly formCapacity = signal<number>(100);
  protected readonly formStatus = signal<'เปิดรับ' | 'ปิดรับ' | 'เต็ม'>('เปิดรับ');
  protected readonly formOrganizerName = signal<string>('');
  protected readonly formOrganizerEmail = signal<string>('');
  protected readonly formOrganizerPhone = signal<string>('');

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
  protected readonly eventTypes = signal<ApiEventType[]>([]);

  // Computed Categories (มาจาก event types ที่แอดมินดูแลอยู่ ไม่ใช่จากหน้าปัจจุบัน)
  protected readonly categories = computed(() => {
    const names = this.eventTypes().map((t) => t.name).filter(Boolean);
    return ['ทุกหมวดหมู่', ...names];
  });

  private readonly totalCount = signal<number>(0);

  // ใน template ใช้แค่ .length เพื่อแสดงจำนวนรวม — ค่านี้มาจาก backend โดยตรงแล้ว
  protected readonly filteredEvents = computed(
    () => Array.from({ length: this.totalCount() }) as AdminEventItem[]
  );

  // Total Pages Computed Signal
  protected readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize() || 1);
    return Math.max(1, Math.ceil(this.totalCount() / size));
  });

  // รายการกิจกรรมของหน้าปัจจุบัน (มาจาก backend แบบแบ่งหน้าจริง)
  protected readonly paginatedEvents = computed(() => this.events());

  // Start Index
  protected readonly startIndex = computed(() => {
    if (this.totalCount() === 0) return 0;
    const size = Math.max(1, this.pageSize() || 1);
    return (this.currentPage() - 1) * size + 1;
  });

  // End Index
  protected readonly endIndex = computed(() => {
    const size = Math.max(1, this.pageSize() || 1);
    return Math.min(this.currentPage() * size, this.totalCount());
  });

  // Page Numbers List for rendering buttons
  protected readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  });

  constructor(private router: Router) {
    this.loadLookups();

    // ดึงข้อมูลใหม่จาก backend ทุกครั้งที่ search/หมวดหมู่/สถานะ/หน้า/ขนาดหน้าเปลี่ยน
    effect(() => {
      const search = this.searchQuery().trim();
      const page = this.currentPage();
      const pageSize = this.pageSize();
      const typeId = this.resolveSelectedTypeId();
      const statusParam = this.resolveSelectedStatusParam();

      this.fetchEvents({
        search: search || undefined,
        type: typeId,
        status: statusParam,
        page,
        page_size: pageSize,
      });
    });
  }

  private resolveSelectedTypeId(): number | undefined {
    const category = this.selectedCategory();
    if (category === 'ทุกหมวดหมู่') return undefined;
    return this.eventTypes().find((t) => t.name === category)?.id;
  }

  private resolveSelectedStatusParam(): string | undefined {
    const status = this.selectedStatus();
    if (status === 'เปิดรับ') return 'open';
    if (status === 'ปิดรับ') return 'closed';
    if (status === 'เต็ม') return 'full';
    return undefined;
  }

  private fetchEvents(params: {
    search?: string;
    type?: number;
    status?: string;
    page: number;
    page_size: number;
  }) {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('page_size', String(params.page_size));

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.type) httpParams = httpParams.set('type', String(params.type));
    if (params.status) httpParams = httpParams.set('status', params.status);

    this.http
      .get<ApiEventListResponse>(`${API_BASE_URL}/events`, { params: httpParams })
      .subscribe((res) => {
        this.events.set(res.data.map(mapAdminEvent));
        this.totalCount.set(res.total);

        // ถ้ามีแถวที่เปิดดูรายชื่อผู้ลงทะเบียนอยู่ ให้โหลดใหม่ (ไม่งั้นจะโดนล้างว่างไปตอน events reload)
        const expandedId = this.expandedEventId();
        if (expandedId) {
          this.loadRegistrants(expandedId);
        }
      });
  }

  // เรียกซ้ำด้วย filter/หน้าปัจจุบันเดิม ใช้หลังบันทึก/ลบ/เปลี่ยนสถานะกิจกรรม
  private refetchCurrentPage() {
    this.fetchEvents({
      search: this.searchQuery().trim() || undefined,
      type: this.resolveSelectedTypeId(),
      status: this.resolveSelectedStatusParam(),
      page: this.currentPage(),
      page_size: this.pageSize(),
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

  toggleRowMenu(eventId: string, evt: Event) {
    evt.stopPropagation();
    this.activeMenuEventId.update((current) => (current === eventId ? null : eventId));
  }

  closeRowMenu() {
    this.activeMenuEventId.set(null);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMenuEventId.set(null);
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
    this.modalStep.set(1);
    this.formTitle.set('');
    this.formDescription.set('');
    const today = new Date().toISOString().slice(0, 10);
    this.formDate.set(today);
    this.formStartTime.set('09:00');
    this.formEndTime.set('17:00');
    this.formLocation.set('');
    this.formLocationAddress.set('');
    this.formCategory.set('เทคโนโลยี');
    this.formCapacity.set(100);
    this.formStatus.set('เปิดรับ');
    this.formOrganizerName.set('');
    this.formOrganizerEmail.set('');
    this.formOrganizerPhone.set('');
    this.isEventModalOpen.set(true);
  }

  openEditEventModal(event: AdminEventItem, evt: Event) {
    evt.stopPropagation();
    this.modalMode.set('edit');
    this.editingEventId.set(event.id);
    this.modalStep.set(1);
    this.formTitle.set(event.title);
    this.formDescription.set(event.description || '');
    const isoDate = event.startDate ? event.startDate.slice(0, 10) : '';
    this.formDate.set(isoDate || event.date);
    this.formStartTime.set(event.startDate ? formatThaiTime(event.startDate) : '09:00');
    this.formEndTime.set(event.endDate ? formatThaiTime(event.endDate) : '17:00');
    this.formLocation.set(event.location);
    this.formLocationAddress.set(event.locationAddress || '');
    this.formCategory.set(event.category);
    this.formCapacity.set(event.capacity);
    this.formStatus.set(event.status);
    this.formOrganizerName.set(event.organizerName || '');
    this.formOrganizerEmail.set(event.organizerContactEmail || '');
    this.formOrganizerPhone.set(event.organizerContactPhone || '');
    this.isEventModalOpen.set(true);
  }

  closeEventModal() {
    this.isEventModalOpen.set(false);
    this.modalStep.set(1);
  }

  nextStep() {
    if (!this.formTitle().trim()) {
      this.showToast('error', 'กรุณากรอกชื่อกิจกรรม');
      return;
    }

    if (!this.formDate()) {
      this.showToast('error', 'กรุณาระบุวันที่จัดงาน');
      return;
    }

    if (!this.formLocation().trim()) {
      this.showToast('error', 'กรุณาระบุชื่อสถานที่จัดงาน');
      return;
    }

    const range = parseThaiDateToIsoRange(
      this.formDate(),
      this.formStartTime(),
      this.formEndTime()
    );

    if (!range) {
      this.showToast('error', 'รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้รูปแบบ dd/mm/yyyy หรือเลือกจากปฏิทิน');
      return;
    }

    this.modalStep.set(2);
  }

  prevStep() {
    this.modalStep.set(1);
  }

  saveEvent() {
    if (!this.formTitle() || !this.formDate() || !this.formLocation()) {
      this.showToast('error', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    const range = parseThaiDateToIsoRange(
      this.formDate(),
      this.formStartTime(),
      this.formEndTime()
    );

    if (!range) {
      this.showToast('error', 'รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้รูปแบบ dd/mm/yyyy หรือเลือกจากปฏิทิน');
      return;
    }

    const capacityNum = Number(this.formCapacity()) || 100;

    this.resolveVenueId(
      this.formLocation(),
      this.formLocationAddress(),
      capacityNum
    ).subscribe((venueId) => {
      const payload = {
        name: this.formTitle(),
        description: this.formDescription(),
        event_type_id: this.resolveEventTypeId(this.formCategory()),
        venue_id: venueId,
        start_date: range.start,
        end_date: range.end,
        max_seats: capacityNum,
        status: this.formStatus() === 'ปิดรับ' ? 'closed' : this.formStatus() === 'เต็ม' ? 'full' : 'open',
        organizer_name: this.formOrganizerName(),
        organizer_contact_email: this.formOrganizerEmail(),
        organizer_contact_phone: this.formOrganizerPhone(),
      };

      if (this.modalMode() === 'add') {
        this.http.post(`${API_BASE_URL}/admin/events`, payload).subscribe({
          next: () => {
            this.refetchCurrentPage();
            this.showToast('success', `เพิ่มกิจกรรม "${payload.name}" สำเร็จ`);
            this.closeEventModal();
          },
          error: () => this.showToast('error', 'เพิ่มกิจกรรมไม่สำเร็จ'),
        });
      } else {
        const eventId = this.editingEventId();

        this.http.put(`${API_BASE_URL}/admin/events/${eventId}`, payload).subscribe({
          next: () => {
            this.refetchCurrentPage();
            this.showToast('success', 'บันทึกการแก้ไขกิจกรรมเรียบร้อย');
            this.closeEventModal();
          },
          error: () => this.showToast('error', 'บันทึกการแก้ไขไม่สำเร็จ'),
        });
      }
    });
  }

  private resolveVenueId(name: string, address: string, capacity: number): Observable<number> {
    const trimmed = name.trim();
    const existing = this.venues().find((v) => v.name.trim().toLowerCase() === trimmed.toLowerCase());

    if (existing) {
      if (address && (!existing.address || existing.address !== address)) {
        return this.http.put<ApiVenue>(`${API_BASE_URL}/admin/venues/${existing.id}`, {
          name: existing.name,
          address: address || existing.address,
          capacity: capacity || existing.capacity,
        }).pipe(
          tap((updated) => {
            this.venues.update((prev) => prev.map((v) => v.id === updated.id ? updated : v));
          }),
          map((v) => v.id),
          catchError(() => of(existing.id))
        );
      }
      return of(existing.id);
    }

    return this.http
      .post<ApiVenue>(`${API_BASE_URL}/admin/venues`, {
        name: trimmed,
        address: address || '',
        capacity: Number(capacity) || 100,
      })
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
        this.refetchCurrentPage();
        this.showToast(
          'info',
          `เปลี่ยนสถานะกิจกรรม "${event.title}" เป็น "${newStatus === 'open' ? 'เปิดรับ' : 'ปิดรับ'}" แล้ว`
        );
      });
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  onCategoryChange(cat: string) {
    this.selectedCategory.set(cat);
    this.currentPage.set(1);
  }

  onStatusChange(status: string) {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
  }

  onPageSizeChange(size: number | string | null | undefined) {
    if (size === null || size === undefined || size === '' || Number(size) < 1) {
      this.pageSize.set(1);
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

  openDeleteModal(event: AdminEventItem, evt: Event) {
    evt.stopPropagation();
    this.eventToDelete.set(event);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.eventToDelete.set(null);
  }

  confirmDelete() {
    const event = this.eventToDelete();
    if (!event) return;

    this.http.delete(`${API_BASE_URL}/admin/events/${event.id}`).subscribe({
      next: () => {
        this.refetchCurrentPage();
        this.showToast('success', `ลบกิจกรรม "${event.title}" เรียบร้อยแล้ว`);
        this.closeDeleteModal();
      },
      error: () => {
        this.showToast('error', 'ลบกิจกรรมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      },
    });
  }

  private showToast(type: 'success' | 'error' | 'info', message: string) {
    this.toast.set({ show: true, type, message });
    setTimeout(() => {
      this.toast.update((curr) => ({ ...curr, show: false }));
    }, 4000);
  }
}
