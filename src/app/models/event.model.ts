export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  registeredCount: number;
  category: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userName: string;
  userEmail: string;
  registrationDate: string;
   status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}
