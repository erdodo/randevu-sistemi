export interface Business {
  id: string;
  name: string;
  slug: string;
  sector: string;
  logo?: string | null;
  primaryColor: string;
  accentColor: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  adminPassword: string;
  workingDays: string;
  openTime: string;
  closeTime: string;
  slotDuration: number;
  isSetupComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  services?: Service[];
  appointments?: Appointment[];
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  createdAt: Date;
}

export interface Webhook {
  id: string;
  url: string;
  event: "appointment_created" | "appointment_approved";
  secret?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  duration: number;
  price?: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  businessId: string;
  serviceId?: string | null;
  service?: Service | null;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "cancelled" | "completed";
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  businessId: string;
  appointmentId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CustomerInfo {
  name: string;
  phone: string;
}
