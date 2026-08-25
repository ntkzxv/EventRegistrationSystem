import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, catchError, map, of, tap } from "rxjs";
import { Event, Registration } from "../models/event.model";
import {
  ApiEventListResponse,
  ApiEventSummary,
  ApiMyRegistrationsResponse,
  ApiRegisterResponse,
  EventSearchParams,
} from "../models/api.model";
import { API_BASE_URL } from "../core/api.constants";
import { formatThaiDateRange } from "../core/thai-date";
import { AuthService } from "./auth.service";

const EVENT_TYPE_COLORS: Record<string, string> = {
  'เทคโนโลยี': '#2563EB',
  'การออกแบบ': '#8B5CF6',
  'อาหารและเครื่องดื่ม': '#F59E0B',
  'สุขภาพและกีฬา': '#10B981',
};

export function mapApiEventToEvent(api: ApiEventSummary): Event {
  return {
    id: String(api.id),
    title: api.name,
    description: api.description ?? '',
    date: formatThaiDateRange(api.start_date, api.end_date),
    location: api.venue?.name ?? '',
    capacity: api.max_seats,
    registeredCount: Math.max(0, api.max_seats - api.seats_remaining),
    category: api.event_type?.name ?? '',
    status: api.status === 'closed' ? 'closed' : 'open',
  };
}

@Injectable({
  providedIn: "root",
})
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly events = signal<Event[]>([]);
  private readonly registrations = signal<Registration[]>([]);
  private readonly loaded = signal<boolean>(false);
  private readonly eventTypeIdByName = new Map<string, number>();

  constructor() {
    this.loadEvents();
  }

  getCategoryColor(category: string): string {
    return EVENT_TYPE_COLORS[category] ?? '#6B7280';
  }

  getEvents() {
    return this.events.asReadonly();
  }

  isLoaded() {
    return this.loaded.asReadonly();
  }

  getRegistrations() {
    return this.registrations.asReadonly();
  }

  getEventById(id: string) {
    return this.events().find((e) => e.id === id);
  }

  getEventTypeIdByName(name: string): number | undefined {
    return this.eventTypeIdByName.get(name);
  }

  getRegistrationByEventId(eventId: string) {
    // registrations() มาจาก backend ที่เรียงล่าสุดก่อนแล้ว
    return this.registrations().find((r) => r.eventId === eventId);
  }

  isEventRegistered(eventId: string): boolean {
    return this.registrations().some(
      (r) => r.eventId === eventId && r.status !== 'CANCELLED'
    );
  }

  loadEvents(): void {
    // ดึงมาให้ครบทุกรายการ (ไม่แบ่งหน้า) เพราะ signal นี้ใช้เป็น cache กลาง
    // สำหรับ event-detail / my-events ที่ต้อง lookup กิจกรรมได้ทุกรายการ
    const params = new HttpParams().set('page_size', '1000');

    this.http.get<ApiEventListResponse>(`${API_BASE_URL}/events`, { params }).subscribe({
      next: (res) => {
        this.events.set(res.data.map(mapApiEventToEvent));

        this.eventTypeIdByName.clear();
        res.data.forEach((event) => {
          if (event.event_type) {
            this.eventTypeIdByName.set(event.event_type.name, event.event_type.id);
          }
        });

        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  /**
   * ดึงกิจกรรมแบบแบ่งหน้าจริงจาก backend (server-side pagination)
   * ใช้สำหรับหน้ารายการที่มี search/filter/pagination เช่น event-list, admin
   */
  searchEvents(params: EventSearchParams): Observable<{ data: Event[]; total: number; page: number }> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('page_size', String(params.page_size ?? 10));

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.type) httpParams = httpParams.set('type', String(params.type));
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http
      .get<ApiEventListResponse>(`${API_BASE_URL}/events`, { params: httpParams })
      .pipe(
        map((res) => ({
          data: res.data.map(mapApiEventToEvent),
          total: res.total,
          page: res.page,
        }))
      );
  }

  refreshMyRegistrations(): void {
    if (!this.authService.isLoggedIn()) {
      this.registrations.set([]);
      return;
    }

    const currentUser = this.authService.getCurrentUser()();

    this.http
      .get<ApiMyRegistrationsResponse>(`${API_BASE_URL}/users/me/registrations`)
      .subscribe((res) => {
        this.registrations.set(
          res.data
            .filter((item) => item.event !== null)
            .map((item): Registration => ({
              id: String(item.id),
              eventId: String(item.event!.id),
              userName: currentUser?.name ?? '',
              userEmail: currentUser?.email ?? '',
              registrationDate: item.registered_at,
              status: item.status === 'confirmed' ? 'CONFIRMED' : 'CANCELLED',
            }))
        );
      });
  }

  registerForEvent(eventId: string): Observable<{ success: boolean; message?: string }> {
    return this.http
      .post<ApiRegisterResponse>(`${API_BASE_URL}/events/${eventId}/register`, {})
      .pipe(
        tap(() => {
          this.loadEvents();
          this.refreshMyRegistrations();
        }),
        map(() => ({ success: true })),
        catchError((err) =>
          of({ success: false, message: err.error?.message as string | undefined })
        )
      );
  }

  cancelRegistration(eventId: string): Observable<{ success: boolean; message?: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${API_BASE_URL}/events/${eventId}/register`
      )
      .pipe(
        tap(() => {
          this.loadEvents();
          this.refreshMyRegistrations();
        }),
        map((res) => ({ success: res.success })),
        catchError((err) =>
          of({ success: false, message: err.error?.message as string | undefined })
        )
      );
  }
}
