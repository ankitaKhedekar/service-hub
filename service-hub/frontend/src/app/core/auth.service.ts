import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Role, Session, User } from './models';

const TOKEN_KEY = 'sh_token';
const USER_KEY = 'sh_user';

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'customer' | 'provider';
  businessName?: string;
  city?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<User | null>(readUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<Session> {
    return this.api.post<Session>('/auth/login', { email, password }).pipe(tap((s) => this.save(s)));
  }

  register(payload: RegisterPayload): Observable<Session> {
    return this.api.post<Session>('/auth/register', payload).pipe(tap((s) => this.save(s)));
  }

  /** Re-read the user from the server (e.g. after admin approval). */
  refresh(): void {
    if (!this.token) return;
    this.api.get<User>('/auth/me').subscribe({
      next: (u) => {
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        this._user.set(u);
      },
    });
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    if (redirect) this.router.navigate(['/login']);
  }

  homeFor(role: Role | null): string {
    if (role === 'admin') return '/admin';
    if (role === 'provider') return '/provider';
    return '/';
  }

  private save(session: Session): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this._user.set(session.user);
  }
}

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && localStorage.getItem(TOKEN_KEY) ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
