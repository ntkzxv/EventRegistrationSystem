import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);


  // ================= STATE =================

  protected readonly searchQuery = signal<string>('');

  protected readonly event = signal<Event | null>(null);

  protected readonly registrationStatus =
    signal<'PENDING' | 'CONFIRMED' | 'CANCELLED' | null>(null);

  protected readonly successMessage = signal<string>('');


  // ================= INIT =================

  constructor() {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/events']);
      return;
    }

    const foundEvent =
      this.eventService.getEventById(id);

    if (!foundEvent) {
      this.router.navigate(['/events']);
      return;
    }

    this.event.set(foundEvent);


    // เช็กสถานะการสมัครของ Event นี้
    const registration =
      this.eventService.getRegistrationByEventId(id);

    this.registrationStatus.set(
      registration?.status ?? null
    );
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


    // ถ้ากำลังรอหรือยืนยันแล้ว ห้ามสมัครซ้ำ
    if (
      this.registrationStatus() === 'PENDING' ||
      this.registrationStatus() === 'CONFIRMED'
    ) {
      return;
    }


    // Event เต็ม
    if (this.isFull(currentEvent)) {
      return;
    }


    const registration =
      this.eventService.registerForEvent({
        eventId: currentEvent.id,
        userName: 'สมชาย รักดี',
        userEmail: 'somchai.r@email.com',
      });


    // สมัครใหม่จะเป็น PENDING
    this.registrationStatus.set(
      registration.status
    );


    // อัปเดตจำนวนผู้สมัคร
    const updatedEvent =
      this.eventService.getEventById(
        currentEvent.id
      );

    if (updatedEvent) {
      this.event.set(updatedEvent);
    }


    this.successMessage.set(
      'ส่งคำขอเข้าร่วมกิจกรรมเรียบร้อยแล้ว กรุณารอการยืนยัน'
    );


    setTimeout(() => {
      this.successMessage.set('');
    }, 4000);
  }


  // ================= NAVIGATION =================

  goBack() {

    this.router.navigate(['/events']);
  }


  goToMyEvents() {

    this.router.navigate(['/my-events']);
  }
}