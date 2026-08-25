export interface ApiEventType {
  id: number;
  name: string;
  badge_color?: string;
}

export interface ApiVenue {
  id: number;
  name: string;
  address?: string;
  capacity?: number;
}

export interface ApiEventSummary {
  id: number;
  name: string;
  description?: string;
  event_type: ApiEventType | null;
  venue: ApiVenue | null;
  organizer_name?: string;
  organizer_contact_email?: string;
  organizer_contact_phone?: string;
  start_date: string;
  end_date: string;
  max_seats: number;
  seats_remaining: number;
  status: 'open' | 'closed' | 'full' | 'draft';
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiEventListResponse {
  data: ApiEventSummary[];
  total: number;
  page: number;
}

export interface ApiRegistrationItem {
  id: number;
  event: {
    id: number;
    name: string;
    start_date: string;
    venue: { name: string } | null;
  } | null;
  status: 'confirmed' | 'cancelled';
  registered_at: string;
}

export interface ApiMyRegistrationsResponse {
  data: ApiRegistrationItem[];
}

export interface ApiRegisterResponse {
  success: boolean;
  registration: { id: number; status: string };
}
