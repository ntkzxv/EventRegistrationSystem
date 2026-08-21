import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

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
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './my-events.component.html',
  styleUrls: ['./my-events.component.css'],
})
export class MyEventsComponent {
  // Search query
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatus = signal<string>('ทั้งหมด');
  protected readonly isUserMenuOpen = signal<boolean>(false);

  // Selected event for Ticket / Detail Modal
  protected readonly selectedEvent = signal<MyEventItem | null>(null);
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly isCancelModalOpen = signal<boolean>(false);
  protected readonly eventToCancel = signal<MyEventItem | null>(null);

  // User Profile
  protected readonly userName = signal<string>('สมชาย รักดี');
  protected readonly userEmail = signal<string>('somchai.r@email.com');

  // Toast Notification State
  protected readonly toast = signal<ToastState>({
    show: false,
    type: 'info',
    message: '',
  });

  // Registered Events List matching Figma mockup + extra details
  protected readonly eventsList = signal<MyEventItem[]>([
    {
      id: 'event-1',
      title: 'สัมมนา AI ในอนาคต',
      date: '24 พ.ย. 2024',
      location: 'True Digital Park',
      status: 'ยืนยันแล้ว',
      ticketCode: 'EVH-AI2024-0891',
      category: 'เทคโนโลยี',
      description: 'งานสัมมนาเจาะลึกนวัตกรรมปัญญาประดิษฐ์และ Machine Learning ยุคใหม่สำหรับการทำงานและธุรกิจ',
    },
    {
      id: 'event-2',
      title: 'งานวิ่ง Mini Marathon',
      date: '05 ธ.ค. 2024',
      location: 'สวนลุมพินี กรุงเทพมหานคร',
      status: 'รอดำเนินการ',
      ticketCode: 'EVH-RUN2024-1142',
      category: 'สุขภาพและกีฬา',
      description: 'กิจกรรมวิ่งเพื่อสุขภาพระยะทาง 5km และ 10km พร้อมรับเหรียญที่ระลึกและเสื้อวิ่ง',
    },
    {
      id: 'event-3',
      title: 'อบรม Data Analytics สำหรับผู้เริ่มต้น',
      date: '20 ธ.ค. 2024',
      location: 'ห้องสัมมนา 402, อาคารสยามพารากอน',
      status: 'ยกเลิกแล้ว',
      ticketCode: 'EVH-DATA2024-0023',
      category: 'เทคโนโลยี',
      description: 'หลักสูตรอบรมการวิเคราะห์ข้อมูลเบื้องต้นด้วย Python และ PowerBI สำหรับผู้ไม่มีพื้นฐาน',
    },
    {
      id: 'event-4',
      title: 'Workshop UX/UI Design 2024',
      date: '15 ม.ค. 2025',
      location: 'BITEC Bangna, กรุงเทพมหานคร',
      status: 'ยืนยันแล้ว',
      ticketCode: 'EVH-UXUI2025-0450',
      category: 'การออกแบบ',
      description: 'เวิร์กช็อปฝึกปฏิบัติออกแบบ Design System และสร้าง Interactive Prototype ด้วย Figma',
    },
  ]);

  // Filtered Events Computed Signal
  protected readonly filteredEvents = computed(() => {
    const list = this.eventsList();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();

    return list.filter((item) => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.date.toLowerCase().includes(query);

      const matchesStatus =
        status === 'ทั้งหมด' || item.status === status;

      return matchesQuery && matchesStatus;
    });
  });

  constructor(private router: Router) {}

  toggleUserMenu() {
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  setStatusFilter(status: string) {
    this.selectedStatus.set(status);
  }

  openEventDetail(event: MyEventItem) {
    this.selectedEvent.set(event);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal() {
    this.isDetailModalOpen.set(false);
    this.selectedEvent.set(null);
  }

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

    this.eventsList.update((prev) =>
      prev.map((e) =>
        e.id === target.id ? { ...e, status: 'ยกเลิกแล้ว' as const } : e
      )
    );

    this.showToast('info', `ยกเลิกการสมัครกิจกรรม "${target.title}" เรียบร้อยแล้ว`);
    this.closeCancelModal();

    if (this.isDetailModalOpen() && this.selectedEvent()?.id === target.id) {
      this.selectedEvent.update((e) => e ? { ...e, status: 'ยกเลิกแล้ว' } : null);
    }
  }

  onReRegister(event: MyEventItem) {
    this.eventsList.update((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, status: 'ยืนยันแล้ว' as const } : e
      )
    );
    this.showToast('success', `สมัครเข้าร่วมกิจกรรม "${event.title}" ใหม่อีกครั้งสำเร็จ!`);
    if (this.isDetailModalOpen()) {
      this.selectedEvent.update((e) => e ? { ...e, status: 'ยืนยันแล้ว' } : null);
    }
  }

  private showToast(type: 'success' | 'error' | 'info', message: string) {
    this.toast.set({ show: true, type, message });
    setTimeout(() => {
      this.toast.update((curr) => ({ ...curr, show: false }));
    }, 4000);
  }
}
