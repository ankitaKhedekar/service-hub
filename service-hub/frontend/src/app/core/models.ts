export type Role = 'customer' | 'provider' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'no_show';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PageMeta { page: number; limit: number; total: number; pages: number; }
export interface ApiResponse<T> { success: boolean; data: T; meta?: PageMeta; message?: string; }
export interface Paged<T> { items: T[]; meta: PageMeta; }

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  approvalStatus?: ApprovalStatus;
}

export interface Session { token: string; user: User; }

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  serviceCount?: number;
  isActive?: boolean;
}

export interface ProviderSummary {
  id: string;
  businessName: string;
  city: string;
  bio?: string;
  experienceYears?: number;
  avgRating: number;
  totalReviews: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  imageUrl?: string;
  isActive: boolean;
  category: { id: string; name: string; slug: string } | null;
  provider: ProviderSummary | null;
}

export interface Slot { start: string; end: string; label: string; available: boolean; }

export interface StatusEvent { status: BookingStatus; byRole: string; note: string; at: string; }

export interface Booking {
  id: string;
  code: string;
  serviceId: string;
  serviceTitle: string;
  price: number;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  address: string;
  notes: string;
  status: BookingStatus;
  cancelReason: string;
  reviewed: boolean;
  statusHistory: StatusEvent[];
  createdAt: string;
  customer: { id: string; name: string; phone: string; email: string } | null;
  provider: { id: string; businessName: string } | null;
}

export interface Review { id: string; rating: number; comment: string; customerName: string; createdAt: string; }

export interface DayHours {
  day: number;
  isOpen: boolean;
  start: string;
  end: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

export interface Availability { slotIntervalMinutes: 15 | 30 | 60; weekly: DayHours[]; leaves: string[]; }

export interface ProviderStats {
  todayBookings: number;
  pendingRequests: number;
  monthEarnings: number;
  monthCompletedJobs: number;
  avgRating: number;
  totalReviews: number;
  approvalStatus: ApprovalStatus;
}

export interface AdminStats {
  days: number;
  totalBookings: number;
  revenue: number;
  activeProviders: number;
  pendingProviders: number;
  customers: number;
  newCustomers: number;
  perDay: { date: string; label: string; count: number }[];
  byStatus: { status: BookingStatus; count: number }[];
  topServices: { title: string; bookings: number; revenue: number }[];
}

export interface AdminProvider {
  id: string;
  businessName: string;
  city: string;
  experienceYears: number;
  bio: string;
  approvalStatus: ApprovalStatus;
  approvalNote: string;
  avgRating: number;
  totalReviews: number;
  serviceCount: number;
  owner: { name: string; email: string; phone: string; isActive: boolean } | null;
  appliedAt: string;
}

export interface SiteStats { providers: number; completedBookings: number; categories: number; avgRating: number; reviews: number; }

export interface SiteReview {
  id: string; rating: number; comment: string; customerName: string; serviceTitle: string; providerName: string; providerId: string; createdAt: string;
}

export interface ContactMessage {
  id: string; name: string; email: string; topic: string; message: string; status: 'new' | 'replied' | 'closed'; createdAt: string;
}

export interface AppNotification { id: string; type: string; message: string; link: string; isRead: boolean; createdAt: string; }
