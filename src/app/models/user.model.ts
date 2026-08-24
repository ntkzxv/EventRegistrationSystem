export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role?: 'user' | 'admin';
  createdAt: string;
}

export interface UserRegistrationDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword?: string;
}
