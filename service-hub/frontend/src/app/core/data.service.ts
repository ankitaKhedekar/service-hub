import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  AdminProvider, AdminStats, AppNotification, Availability, Booking, BookingStatus, Category, ContactMessage, SiteReview, SiteStats,
  ProviderStats, ProviderSummary, Review, ServiceItem, Slot, User,
} from './models';

/** Every API call the app makes, grouped by area. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private api = inject(ApiService);

  // ---------- Public ----------
  categories() { return this.api.get<Category[]>('/categories'); }
  services(params: { q?: string; category?: string; city?: string; sort?: string; page?: number; limit?: number; providerId?: string }) {
    return this.api.getPaged<ServiceItem>('/services', params);
  }
  service(id: string) { return this.api.get<ServiceItem>(`/services/${id}`); }
  slots(serviceId: string, date: string) {
    return this.api.get<{ date: string; durationMinutes: number; slots: Slot[] }>(`/services/${serviceId}/slots`, { date });
  }
  provider(id: string) {
    return this.api.get<{ provider: ProviderSummary; services: ServiceItem[]; reviews: Review[] }>(`/providers/${id}`);
  }

  // ---------- Website ----------
  siteStats() { return this.api.get<SiteStats>('/site/stats'); }
  siteReviews(limit = 6) { return this.api.get<SiteReview[]>('/site/reviews', { limit }); }
  subscribe(email: string) { return this.api.post<{ subscribed: boolean }>('/site/newsletter', { email }); }
  contact(body: { name: string; email: string; topic: string; message: string; website: string }) {
    return this.api.post<{ received: boolean }>('/site/contact', body);
  }

  // ---------- Customer ----------
  createBooking(body: { serviceId: string; startTime: string; address: string; notes?: string }) {
    return this.api.post<Booking>('/bookings', body);
  }
  myBookings(params: { status?: string; page?: number }) { return this.api.getPaged<Booking>('/bookings/my', params); }
  booking(id: string) { return this.api.get<Booking>(`/bookings/${id}`); }
  changeStatus(id: string, status: BookingStatus, note = '') {
    return this.api.patch<Booking>(`/bookings/${id}/status`, { status, note });
  }
  review(body: { bookingId: string; rating: number; comment?: string }) { return this.api.post<Review>('/reviews', body); }

  // ---------- Notifications ----------
  notifications() { return this.api.get<{ unread: number; items: AppNotification[] }>('/notifications'); }
  readNotification(id: string) { return this.api.patch(`/notifications/${id}/read`); }
  readAllNotifications() { return this.api.patch('/notifications/read-all'); }

  // ---------- Provider ----------
  providerStats() { return this.api.get<ProviderStats>('/provider/stats'); }
  providerProfile() { return this.api.get<Record<string, unknown>>('/provider/profile'); }
  updateProviderProfile(body: object) { return this.api.put('/provider/profile', body); }
  providerServices() { return this.api.get<ServiceItem[]>('/provider/services'); }
  createService(body: object) { return this.api.post<ServiceItem>('/provider/services', body); }
  updateService(id: string, body: object) { return this.api.put<ServiceItem>(`/provider/services/${id}`, body); }
  deleteService(id: string) { return this.api.delete<{ deleted: boolean; hidden?: boolean; message?: string }>(`/provider/services/${id}`); }
  availability() { return this.api.get<Availability>('/provider/availability'); }
  saveAvailability(body: Availability) { return this.api.put<Availability>('/provider/availability', body); }
  providerBookings(params: { status?: string; page?: number; from?: string; to?: string }) {
    return this.api.getPaged<Booking>('/provider/bookings', params);
  }

  // ---------- Admin ----------
  adminStats(days = 7) { return this.api.get<AdminStats>('/admin/stats', { days }); }
  adminProviders(params: { status?: string; page?: number }) { return this.api.getPaged<AdminProvider>('/admin/providers', params); }
  setApproval(id: string, status: 'approved' | 'rejected', note = '') {
    return this.api.patch(`/admin/providers/${id}/approval`, { status, note });
  }
  adminCategories() { return this.api.get<Category[]>('/admin/categories'); }
  createCategory(body: object) { return this.api.post<Category>('/admin/categories', body); }
  updateCategory(id: string, body: object) { return this.api.put<Category>(`/admin/categories/${id}`, body); }
  deleteCategory(id: string) { return this.api.delete(`/admin/categories/${id}`); }
  adminServices(params: { q?: string; page?: number }) {
    return this.api.getPaged<{ id: string; title: string; price: number; durationMinutes: number; isActive: boolean; category: string; provider: string }>('/admin/services', params);
  }
  setServiceActive(id: string, isActive: boolean) { return this.api.patch(`/admin/services/${id}/active`, { isActive }); }
  adminUsers(params: { role?: string; q?: string; page?: number }) { return this.api.getPaged<User>('/admin/users', params); }
  setUserStatus(id: string, isActive: boolean) { return this.api.patch<User>(`/admin/users/${id}/status`, { isActive }); }
  adminBookings(params: { status?: string; q?: string; page?: number }) { return this.api.getPaged<Booking>('/admin/bookings', params); }
  adminMessages(params: { status?: string; page?: number }) { return this.api.getPaged<ContactMessage>('/admin/messages', params); }
  setMessageStatus(id: string, status: ContactMessage['status']) { return this.api.patch(`/admin/messages/${id}`, { status }); }
}
