import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, Paged } from './models';

type Params = Record<string, string | number | boolean | null | undefined>;

/** Thin wrapper over HttpClient that unwraps the API's { success, data, meta } envelope. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  get<T>(path: string, params?: Params): Observable<T> {
    return this.http.get<ApiResponse<T>>(this.base + path, { params: toParams(params) }).pipe(map((r) => r.data));
  }

  getPaged<T>(path: string, params?: Params): Observable<Paged<T>> {
    return this.http
      .get<ApiResponse<T[]>>(this.base + path, { params: toParams(params) })
      .pipe(map((r) => ({ items: r.data, meta: r.meta ?? { page: 1, limit: r.data.length, total: r.data.length, pages: 1 } })));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.base + path, body).pipe(map((r) => r.data));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<ApiResponse<T>>(this.base + path, body).pipe(map((r) => r.data));
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.patch<ApiResponse<T>>(this.base + path, body).pipe(map((r) => r.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(this.base + path).pipe(map((r) => r.data));
  }
}

function toParams(params?: Params): HttpParams {
  let p = new HttpParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== null && value !== undefined && value !== '') p = p.set(key, String(value));
  }
  return p;
}

/** Turn any HTTP error into a message people can read. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Check your internet connection or that the API is running.';
    const body = err.error as { message?: string; details?: { message: string }[] } | null;
    if (body?.details?.length) return `${body.message}: ${body.details.map((d) => d.message).join(', ')}`;
    return body?.message || `Request failed (${err.status})`;
  }
  return 'Something went wrong';
}
