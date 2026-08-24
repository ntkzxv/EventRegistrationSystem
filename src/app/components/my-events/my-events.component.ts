import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';

export interface MyEventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'ยืนยันแล้ว' | 'รอดำเนินการ' | 'ยกเลิกแล้ว';
  ticketCode?: string;
  category?: string;
  description?: string;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent
  ],
  templateUrl: './my-events.component.html',
  styleUrls: ['./my-events.component.css'],
})
export class MyEventsComponent {

  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ข้อมูลจาก EventService ตัวเดียวกับหน้า Event Detail
  private readonly allEvents = this.eventService.getEvents();
  private readonly registrations = this.eventService.getRegistrations();

  constructor() {
    this.eventService.refreshMyRegistrations();
  }

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatus = signal<string>('ทั้งหมด');

  protected readonly selectedEvent =
    signal<MyEventItem | null>(null);

  protected readonly isDetailModalOpen =
    signal<boolean>(false);

  protected readonly isCancelModalOpen =
    signal<boolean>(false);

  protected readonly eventToCancel =
    signal<MyEventItem | null>(null);

  protected readonly userName = computed(
    () => this.authService.getCurrentUser()()?.name ?? ''
  );

  protected readonly userEmail = computed(
    () => this.authService.getCurrentUser()()?.email ?? ''
  );

  protected readonly toast = signal<ToastState>({
    show: false,
    type: 'info',
    message: '',
  });

  // =====================================================
  // เอา Registration มารวมกับรายละเอียด Event
  // =====================================================

  protected readonly eventsList = computed<MyEventItem[]>(() => {

    const events = this.allEvents();
    const registrations = this.registrations();

  return registrations
    .map((registration): MyEventItem | null => {

      const event = events.find(
        e => e.id === registration.eventId
      );

      if (!event) {
        return null;
      }

      return {
      id: event.id,
      title: event.title,
      date: event.date,
      location: event.location,

      status:
        registration.status === 'CONFIRMED'
          ? 'ยืนยันแล้ว'
          : registration.status === 'PENDING'
            ? 'รอดำเนินการ'
            : 'ยกเลิกแล้ว',

      ticketCode: `EVH-${registration.id.toUpperCase()}`,
      category: event.category,
      description: event.description,
    };
    })
    .filter(
      (item): item is MyEventItem => item !== null
    );
  });


  // =====================================================
  // Search + Status Filter
  // =====================================================

  protected readonly filteredEvents = computed(() => {

    const list = this.eventsList();

    const query =
      this.searchQuery().trim().toLowerCase();

    const status =
      this.selectedStatus();

    return list.filter(item => {

      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.date.toLowerCase().includes(query);

      const matchesStatus =
        status === 'ทั้งหมด' ||
        item.status === status;

      return matchesQuery && matchesStatus;
    });
  });


  setStatusFilter(status: string) {
    this.selectedStatus.set(status);
  }


  // =====================================================
  // Event Detail Modal
  // =====================================================

  openEventDetail(event: MyEventItem) {
    this.selectedEvent.set(event);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal() {
    this.isDetailModalOpen.set(false);
    this.selectedEvent.set(null);
  }


  // =====================================================
  // Cancel Registration
  // =====================================================

  promptCancel(event: MyEventItem) {
    this.eventToCancel.set(event);
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal() {
    this.isCancelModalOpen.set(false);
    this.eventToCancel.set(null);
  }

  confirmCancelRegistration() {

    const target = this.eventToCancel();

    if (!target) return;

    // ใช้ Service ตัวเดียวกับหน้า Event Detail
    this.eventService.cancelRegistration(target.id).subscribe((result) => {

      this.showToast(
        result.success ? 'info' : 'error',
        result.success
          ? `ยกเลิกการสมัครกิจกรรม "${target.title}" เรียบร้อยแล้ว`
          : (result.message ?? 'ยกเลิกการสมัครไม่สำเร็จ')
      );

      this.closeCancelModal();
      this.closeDetailModal();
    });
  }


  // =====================================================
  // ไปหน้ารายละเอียดจริง
  // =====================================================

  goToEventDetail(event: MyEventItem) {
    this.router.navigate(['/events', event.id]);
  }

  onReRegister(event: MyEventItem) {
  const originalEvent = this.allEvents().find(
    e => e.id === event.id
  );

  if (!originalEvent) return;

  if (this.eventService.isEventRegistered(event.id)) {
    return;
  }

  this.eventService.registerForEvent(event.id).subscribe((result) => {

    this.showToast(
      result.success ? 'success' : 'error',
      result.success
        ? `สมัครเข้าร่วมกิจกรรม "${event.title}" ใหม่อีกครั้งสำเร็จ`
        : (result.message ?? 'สมัครเข้าร่วมกิจกรรมไม่สำเร็จ')
    );

    this.closeDetailModal();
  });
}
  private showToast(
    type: 'success' | 'error' | 'info',
    message: string
  ) {

    this.toast.set({
      show: true,
      type,
      message
    });

    setTimeout(() => {

      this.toast.update(current => ({
        ...current,
        show: false
      }));

    }, 4000);
  }
}