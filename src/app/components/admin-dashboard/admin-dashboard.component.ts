import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { API_BASE_URL } from '../../core/api.constants';
import { formatThaiDate } from '../../core/thai-date';

export interface RecentRegistration {
  id: string;
  name: string;
  eventName: string;
  registeredDate: string;
  status: 'สำเร็จ' | 'รอดำเนินการ' | 'ยกเลิกแล้ว';
}

interface ApiDashboardResponse {
  total_registrations: number;
  total_events: number;
  open_events: number;
  closed_events: number;
  recent_registrations: {
    user_name: string;
    event_name: string;
    registered_at: string;
    status: 'confirmed' | 'cancelled';
  }[];
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  private readonly http = inject(HttpClient);

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
  protected readonly totalRegistrations = signal<number>(0);
  protected readonly totalEvents = signal<number>(0);
  protected readonly activeEvents = signal<number>(0);
  protected readonly closedEvents = signal<number>(0);

  // Registrations Dataset (จาก backend)
  protected readonly registrations = signal<RecentRegistration[]>([]);

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

  constructor(private router: Router) {
    this.loadDashboard();
  }

  private loadDashboard() {
    this.http.get<ApiDashboardResponse>(`${API_BASE_URL}/admin/dashboard`).subscribe((res) => {
      this.totalRegistrations.set(res.total_registrations);
      this.totalEvents.set(res.total_events);
      this.activeEvents.set(res.open_events);
      this.closedEvents.set(res.closed_events);

      this.registrations.set(
        res.recent_registrations.map((r, index) => ({
          id: `reg-${index}`,
          name: r.user_name,
          eventName: r.event_name,
          registeredDate: formatThaiDate(r.registered_at),
          status: r.status === 'confirmed' ? 'สำเร็จ' : 'ยกเลิกแล้ว',
        }))
      );
    });
  }

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
    const list = this.filteredRegistrations();
    if (list.length === 0) {
      this.showToast('info', 'ไม่พบข้อมูลสำหรับส่งออก CSV');
      return;
    }

    const headers = ['ลำดับ', 'ชื่อผู้ลงทะเบียน', 'เข้าร่วมกิจกรรม', 'วันที่ลงทะเบียนสมัคร', 'สถานะ'];
    const csvRows: string[] = [headers.join(',')];

    list.forEach((item, index) => {
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      csvRows.push([
        index + 1,
        escape(item.name),
        escape(item.eventName),
        escape(item.registeredDate),
        escape(item.status),
      ].join(','));
    });

    // เพิ่ม UTF-8 BOM (\uFEFF) เพื่อให้ Excel เปิดภาษาไทยได้ถูกต้อง ไม่เป็นภาษาต่างดาว
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);

    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานการลงทะเบียน_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast('success', 'ดาวน์โหลดรายงานสรุปผลกิจกรรม (CSV) สำเร็จเรียบร้อย');
  }

  private showToast(type: 'success' | 'error' | 'info', message: string) {
    this.toast.set({ show: true, type, message });
    setTimeout(() => {
      this.toast.update((curr) => ({ ...curr, show: false }));
    }, 4000);
  }
}
