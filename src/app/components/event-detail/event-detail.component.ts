import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { Event, Registration } from '../../models/event.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent
  ],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class EventDetailComponent {

  // ================= SERVICES =================

  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);


  // ================= STATE =================

  protected readonly searchQuery = signal<string>('');

  private readonly eventId: string;

  protected readonly event = computed<Event | null>(() => {
    const found = this.eventService.getEventById(this.eventId);
    return found ?? null;
  });

  protected readonly registrationStatus = computed<Registration['status'] | null>(() => {
    const registration = this.eventService.getRegistrationByEventId(this.eventId);
    return registration?.status ?? null;
  });

  protected readonly successMessage = signal<string>('');


  // ================= INIT =================

  constructor() {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/events']);
      this.eventId = '';
      return;
    }

    this.eventId = id;

    this.eventService.refreshMyRegistrations();

    // ถ้าโหลดรายการกิจกรรมเสร็จแล้วแต่ไม่พบ id นี้ ให้ถือว่าไม่พบกิจกรรมจริง ๆ
    effect(() => {
      if (this.eventService.isLoaded()() && !this.event()) {
        this.router.navigate(['/events']);
      }
    });
  }


  // ================= SEATS =================

  getAvailableSeats(event: Event): number {

    return Math.max(
      0,
      event.capacity - event.registeredCount
    );
  }


  getPercentage(event: Event): number {

    if (event.capacity <= 0) {
      return 0;
    }

    return Math.min(
      100,
      (event.registeredCount / event.capacity) * 100
    );
  }


  isFull(event: Event): boolean {

    return event.registeredCount >= event.capacity;
  }


  // ================= CATEGORY COLOR =================

  getCategoryColor(category: string): string {

    return this.eventService.getCategoryColor(category);
  }


  // ================= REGISTER =================

  registerEvent() {

    const currentEvent = this.event();

    if (!currentEvent) return;


    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }


    // ถ้ายืนยันแล้ว ห้ามสมัครซ้ำ
    if (this.registrationStatus() === 'CONFIRMED') {
      return;
    }


    // Event เต็ม
    if (this.isFull(currentEvent)) {
      return;
    }


    this.eventService.registerForEvent(currentEvent.id).subscribe((result) => {

      if (!result.success) {
        this.successMessage.set(result.message ?? 'สมัครเข้าร่วมกิจกรรมไม่สำเร็จ');
        setTimeout(() => this.successMessage.set(''), 4000);
        return;
      }

      this.successMessage.set(
        'สมัครเข้าร่วมกิจกรรมสำเร็จ กรุณาตรวจสอบสถานะที่เมนู "กิจกรรมของฉัน"'
      );

      setTimeout(() => {
        this.successMessage.set('');
      }, 4000);
    });
  }


  // ================= NAVIGATION =================

  goBack() {

    this.router.navigate(['/events']);
  }


  goToMyEvents() {

    this.router.navigate(['/my-events']);
  }
}
