import { Injectable, signal } from "@angular/core";
import { Event, Registration } from "../models/event.model";

const EVENT_TYPE_COLORS: Record<string, string> = {
  'เทคโนโลยี': '#2563EB',
  'การออกแบบ': '#8B5CF6',
  'อาหารและเครื่องดื่ม': '#F59E0B',
  'สุขภาพและกีฬา': '#10B981',
};

@Injectable({
  providedIn: "root",
})
export class EventService {
  private readonly events = signal<Event[]>([
    {
      id: "1",
      title: "สัมมนา AI ในอนาคต",
      description: "ร่วมเจาะลึกนวัตกรรมปัญญาประดิษฐ์ (AI & LLM) กับผู้เชี่ยวชาญระดับแนวหน้าของไทย ทำความเข้าใจแนวโน้มและการประยุกต์ใช้ AI ในภาคธุรกิจและชีวิตประจำวัน",
      date: "24 พ.ย. 2024 • 09:00 - 16:30 น.",
      location: "ห้องประชุมใหญ่ A, True Digital Park",
      capacity: 120,
      registeredCount: 108,
      category: "เทคโนโลยี",
    },
    {
      id: "2",
      title: "Workshop UX/UI Design",
      description: "เวิร์กช็อปเข้มข้นที่จะพาคุณฝึกฝนการออกแบบ User Experience และ User Interface สำหรับแอปพลิเคชันยุคใหม่ พร้อมการลงมือปฏิบัติจริงด้วย Figma",
      date: "30 พ.ย. 2024 • 13:00 - 17:00 น.",
      location: "อาคารวิศวกรรม, มหาวิทยาลัยชื่อดัง",
      capacity: 40,
      registeredCount: 35,
      category: "การออกแบบ",
    },
    {
      id: "3",
      title: "Thailand Tech Conference 2024",
      description: "งานประชุมเทคโนโลยีที่ใหญ่ที่สุดแห่งปี รวบรวมหัวข้อด้าน Cloud, DevOps, Cyber Security และ Software Engineering จากวิทยากรระดับ Global",
      date: "15 ธ.ค. 2024 • 09:00 - 18:00 น.",
      location: "BITEC Bangna, กรุงเทพมหานคร",
      capacity: 500,
      registeredCount: 342,
      category: "เทคโนโลยี",
    },
    {
      id: "4",
      title: "Creative Coding & Design Summit",
      description: "การพบปะของนักออกแบบและนักพัฒนาที่สร้างสรรค์งาน Interactive Art, Generative Design และ Creative Technology",
      date: "20 ธ.ค. 2024 • 10:00 - 16:00 น.",
      location: "Samyan Mitrtown Hall, กรุงเทพมหานคร",
      capacity: 200,
      registeredCount: 180,
      category: "การออกแบบ",
    },
    {
      id: "5",
      title: "Thai Food & Gastronomy Expo",
      description: "สัมผัสวัฒนธรรมอาหารไทยร่วมสมัย เทคนิคการปรุงอาหาร และการต่อยอดวัตถุดิบท้องถิ่นสู่มาตรฐานสากล พร้อมชิมอาหารจากเชฟชื่อดัง",
      date: "5 ม.ค. 2025 • 11:00 - 20:00 น.",
      location: "Siam Square One, กรุงเทพมหานคร",
      capacity: 1000,
      registeredCount: 850,
      category: "อาหารและเครื่องดื่ม",
    },
    {
      id: "6",
      title: "Bangkok City Marathon & Wellness",
      description: "กิจกรรมวิ่งเพื่อสุขภาพใจกลางเมือง ส่งเสริมการออกกำลังกาย พร้อมจุดบริการสุขภาพและให้คำปรึกษาด้านโภชนาการฟรี",
      date: "18 ม.ค. 2025 • 05:00 - 10:00 น.",
      location: "สวนลุมพินี, กรุงเทพมหานคร",
      capacity: 800,
      registeredCount: 720,
      category: "สุขภาพและกีฬา",
    },
  ]);
  getCategoryColor(category: string): string {
  return EVENT_TYPE_COLORS[category] ?? '#6B7280';
  }
  private readonly registrations = signal<Registration[]>([
    {
      id: "reg-demo-1",
      eventId: "1",
      userName: "สมชาย รักดี",
      userEmail: "somchai.r@email.com",
      registrationDate: "2024-11-01T10:00:00.000Z",
      status: "CONFIRMED",
    }
  ]);

  getEvents() {
    return this.events.asReadonly();
  }

  getRegistrations() {
    return this.registrations.asReadonly();
  }

  getEventById(id: string) {
    return this.events().find((e) => e.id === id);
  }
  getRegistrationByEventId(eventId: string) {
  return [...this.registrations()]
    .reverse()
    .find((r) => r.eventId === eventId);
  }
  isEventRegistered(eventId: string): boolean {
    return this.registrations().some((r) => r.eventId === eventId);
  }

  registerForEvent(registration: Omit<Registration, "id" | "registrationDate"| "status">) {
    const newRegistration: Registration = {
      ...registration,
      id: Math.random().toString(36).substring(2, 9),
      registrationDate: new Date().toISOString(),
      status: "PENDING",
    };

    this.registrations.update((prev) => [...prev, newRegistration]);
    
    // Update event count
    this.events.update((prev) => 
      prev.map((e) => 
        e.id === registration.eventId 
          ? { ...e, registeredCount: Math.min(e.capacity, e.registeredCount + 1) } 
          : e
      )
    );

    return newRegistration;
  }

  cancelRegistration(eventId: string) {

    const registration = this.registrations().find(
      (r) =>
        r.eventId === eventId &&
        r.status !== 'CANCELLED'
    );

    if (!registration) {
      return;
    }

    // เปลี่ยนสถานะเป็น CANCELLED
    // ไม่ลบ Registration
    this.registrations.update((prev) =>
      prev.map((r) =>
        r.id === registration.id
          ? {
              ...r,
              status: 'CANCELLED'
            }
          : r
      )
    );

    // คืนที่นั่ง
    this.events.update((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? {
              ...event,
              registeredCount: Math.max(
                0,
                event.registeredCount - 1
              )
            }
          : event
      )
    );
  }
}

