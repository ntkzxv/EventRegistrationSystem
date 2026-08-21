import { Injectable, signal } from "@angular/core";
import { Event, Registration } from "../models/event.model";

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
      imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1470&auto=format&fit=crop",
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
      imageUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1470&auto=format&fit=crop",
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
      imageUrl: "https://images.unsplash.com/photo-1540575861501-7ad0582373f2?q=80&w=1470&auto=format&fit=crop",
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
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1470&auto=format&fit=crop",
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
      imageUrl: "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=1528&auto=format&fit=crop",
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
      imageUrl: "https://images.unsplash.com/photo-1459749411177-042180ceea72?q=80&w=1470&auto=format&fit=crop",
      capacity: 800,
      registeredCount: 720,
      category: "สุขภาพและกีฬา",
    },
  ]);

  private readonly registrations = signal<Registration[]>([
    {
      id: "reg-demo-1",
      eventId: "1",
      userName: "สมชาย รักดี",
      userEmail: "somchai.r@email.com",
      registrationDate: "2024-11-01T10:00:00.000Z",
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

  isEventRegistered(eventId: string): boolean {
    return this.registrations().some((r) => r.eventId === eventId);
  }

  registerForEvent(registration: Omit<Registration, "id" | "registrationDate">) {
    const newRegistration: Registration = {
      ...registration,
      id: Math.random().toString(36).substring(2, 9),
      registrationDate: new Date().toISOString(),
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
    this.registrations.update((prev) => prev.filter((r) => r.eventId !== eventId));
    this.events.update((prev) => 
      prev.map((e) => 
        e.id === eventId 
          ? { ...e, registeredCount: Math.max(0, e.registeredCount - 1) } 
          : e
      )
    );
  }
}

