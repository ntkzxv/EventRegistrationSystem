import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

export interface RecentRegistration {
  id: string;
  name: string;
  eventName: string;
  registeredDate: string;
  status: 'สำเร็จ' | 'รอดำเนินการ' | 'ยกเลิกแล้ว';
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  // Navigation active tab
  protected readonly activeTab = signal<'dashboard' | 'events'>('dashboard');

  // Search & Filter
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatus = signal<string>('ทั้งหมด');
  protected readonly isUserMenuOpen = signal<boolean>(false);

  // Toast State
  protected readonly toast = signal<ToastState>({
    show: false,
    type: 'info',
    message: '',
  });

  // KPI Metrics Signals
  protected readonly totalRegistrations = signal<number>(801);
  protected readonly totalEvents = signal<number>(8);
  protected readonly activeEvents = signal<number>(5);
  protected readonly closedEvents = signal<number>(3);

  // Registrations Dataset matching Figma mockup
  protected readonly registrations = signal<RecentRegistration[]>([
    {
      id: 'reg-1',
      name: 'นาง วิภา เลิศเลอ',
      eventName: 'สัมมนา AI ในอนาคต',
      registeredDate: '15 พ.ย. 2024 - 14:32 น.',
      status: 'สำเร็จ',
    },
    {
      id: 'reg-2',
      name: 'นาย สมบัติ นามดี',
      eventName: 'งานวิ่ง Mini Marathon',
      registeredDate: '15 พ.ย. 2024 - 13:15 น.',
      status: 'รอดำเนินการ',
    },
    {
      id: 'reg-3',
      name: 'นางสาว อรอนงค์ ปรีชา',
      eventName: 'Workshop UX/UI Design',
      registeredDate: '14 พ.ย. 2024 - 16:45 น.',
      status: 'สำเร็จ',
    },
    {
      id: 'reg-4',
      name: 'นาย สุวัจน์ พิสุทธิ์',
      eventName: 'อบรม Data Analytics',
      registeredDate: '14 พ.ย. 2024 - 10:20 น.',
      status: 'ยกเลิกแล้ว',
    },
    {
      id: 'reg-5',
      name: 'นาย วิทยา เกริกไกร',
      eventName: 'สัมมนา AI ในอนาคต',
      registeredDate: '13 พ.ย. 2024 - 09:12 น.',
      status: 'สำเร็จ',
    },
    {
      id: 'reg-6',
      name: 'นาย ชาคริต รุ่งอรุณ',
      eventName: 'คอนเสิร์ตการกุศล',
      registeredDate: '12 พ.ย. 2024 - 17:05 น.',
      status: 'สำเร็จ',
    },
  ]);

  // Filtered Registrations Computed Signal
  protected readonly filteredRegistrations = computed(() => {
    const list = this.registrations();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();

    return list.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.eventName.toLowerCase().includes(query);

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

  exportCSV() {
    this.showToast('success', 'ดาวน์โหลดรายงานสรุปผลกิจกรรม (CSV) สำเร็จเรียบร้อย');
  }

  private showToast(type: 'success' | 'error' | 'info', message: string) {
    this.toast.set({ show: true, type, message });
    setTimeout(() => {
      this.toast.update((curr) => ({ ...curr, show: false }));
    }, 4000);
  }
}
