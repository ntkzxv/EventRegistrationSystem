import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-admin-event-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-event-management.component.html',
  styleUrls: ['./admin-event-management.component.css'],
})
export class AdminEventManagementComponent {
  // Navigation active tab
  protected readonly activeTab = signal<'events' | 'dashboard'>('events');

  // Expanded event ID (default to first event 'event-1' as shown in Figma)
  protected readonly expandedEventId = signal<string | null>('event-1');

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

  // Admin Events dataset matching Figma spec
  protected readonly events = signal<AdminEventItem[]>([
    {
      id: 'event-1',
      title: 'สัมมนา AI ในอนาคต',
      date: '24 พ.ย. 2024',
      location: 'True Digital Park',
      category: 'เทคโนโลยี',
      registeredCount: 108,
      capacity: 120,
      status: 'เปิดรับ',
      registrants: [
        {
          id: 'reg-1',
          name: 'นาย สมศักดิ์ มีชัย',
          email: 'somsak@email.com',
          registeredDate: '12 พ.ย. 2024',
          status: 'ยืนยันแล้ว',
        },
        {
          id: 'reg-2',
          name: 'นางสาว พัชรา แสงทอง',
          email: 'patchara.s@email.com',
          registeredDate: '14 พ.ย. 2024',
          status: 'ยืนยันแล้ว',
        },
        {
          id: 'reg-3',
          name: 'นาย มงคล เจริญรัตน์',
          email: 'mongkol.c@email.com',
          registeredDate: '15 พ.ย. 2024',
          status: 'รอดำเนินการ',
        },
        {
          id: 'reg-4',
          name: 'นาง วิภา เลิศเลอ',
          email: 'wipha.l@email.com',
          registeredDate: '15 พ.ย. 2024',
          status: 'ยืนยันแล้ว',
        },
      ],
    },
    {
      id: 'event-2',
      title: 'Workshop UX/UI Design',
      date: '30 พ.ย. 2024',
      location: 'อาคารวิศวกรรม',
      category: 'การออกแบบ',
      registeredCount: 35,
      capacity: 40,
      status: 'เปิดรับ',
      registrants: [
        {
          id: 'reg-201',
          name: 'นางสาว อรอนงค์ ปรีชา',
          email: 'on-anong@email.com',
          registeredDate: '14 พ.ย. 2024',
          status: 'ยืนยันแล้ว',
        },
        {
          id: 'reg-202',
          name: 'นาย ชาคริต รุ่งอรุณ',
          email: 'chakrit.r@email.com',
          registeredDate: '16 พ.ย. 2024',
          status: 'ยืนยันแล้ว',
        },
      ],
    },
    {
      id: 'event-3',
      title: 'งานวิ่ง Mini Marathon',
      date: '05 ธ.ค. 2024',
      location: 'สวนลุมพินี',
      category: 'กีฬา',
      registeredCount: 358,
      capacity: 500,
      status: 'เปิดรับ',
      registrants: [
        {
          id: 'reg-301',
          name: 'นาย สมบัติ นามดี',
          email: 'sombat.n@email.com',
          registeredDate: '15 พ.ย. 2024',
          status: 'รอดำเนินการ',
        },
      ],
    },
    {
      id: 'event-4',
      title: 'คอนเสิร์ตการกุศล',
      date: '15 ธ.ค. 2024',
      location: 'ศูนย์วัฒนธรรมฯ',
      category: 'ดนตรี',
      registeredCount: 300,
      capacity: 300,
      status: 'เต็ม',
      registrants: [
        {
          id: 'reg-401',
          name: 'นาย พิพัฒน์ สุขสันต์',
          email: 'pipat.s@email.com',
          registeredDate: '10 พ.ย. 2024',
          status: 'ยืนยันแล้ว',
        },
      ],
    },
  ]);

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

  constructor(private router: Router) {}

  toggleExpand(eventId: string) {
    if (this.expandedEventId() === eventId) {
      this.expandedEventId.set(null);
    } else {
      this.expandedEventId.set(eventId);
    }
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

    if (this.modalMode() === 'add') {
      const newEvent: AdminEventItem = {
        id: 'event-' + Date.now(),
        title: this.formTitle(),
        date: this.formDate(),
        location: this.formLocation(),
        category: this.formCategory(),
        registeredCount: 0,
        capacity: Number(this.formCapacity()),
        status: this.formStatus(),
        registrants: [],
      };
      this.events.update((prev) => [newEvent, ...prev]);
      this.showToast('success', `เพิ่มกิจกรรม "${newEvent.title}" สำเร็จ`);
    } else {
      const eventId = this.editingEventId();
      this.events.update((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                title: this.formTitle(),
                date: this.formDate(),
                location: this.formLocation(),
                category: this.formCategory(),
                capacity: Number(this.formCapacity()),
                status: this.formStatus(),
              }
            : e
        )
      );
      this.showToast('success', 'บันทึกการแก้ไขกิจกรรมเรียบร้อย');
    }

    this.closeEventModal();
  }

  toggleEventStatus(event: AdminEventItem, evt: Event) {
    evt.stopPropagation();
    const newStatus = event.status === 'เปิดรับ' ? 'ปิดรับ' : 'เปิดรับ';
    this.events.update((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, status: newStatus } : e))
    );
    this.showToast('info', `เปลี่ยนสถานะกิจกรรม "${event.title}" เป็น "${newStatus}" แล้ว`);
  }

  private showToast(type: 'success' | 'error' | 'info', message: string) {
    this.toast.set({ show: true, type, message });
    setTimeout(() => {
      this.toast.update((curr) => ({ ...curr, show: false }));
    }, 4000);
  }
}
