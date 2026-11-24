import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { StatusBadge } from '../../shared/status-badge';
import { Pager } from '../../shared/pager';
import { PageMeta, User } from '../../core/models';

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe, StatusBadge, Pager],
  template: `
    <div class="stack-lg">
      <h1>Users</h1>
      <div class="card pad form-inline">
        <div class="field grow">
          <label for="q">Search</label>
          <input id="q" type="search" placeholder="Name or email" #q (keyup.enter)="apply(q.value, role.value)" />
        </div>
        <div class="field">
          <label for="role">Role</label>
          <select id="role" #role (change)="apply(q.value, role.value)">
            <option value="">All</option><option value="customer">Customers</option><option value="provider">Providers</option><option value="admin">Admins</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" (click)="apply(q.value, role.value)">Search</button>
      </div>
      <div class="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th class="right">Action</th></tr></thead>
          <tbody>
            @for (u of items(); track u.id) {
              <tr>
                <td><strong>{{ u.name }}</strong></td>
                <td>{{ u.email }}</td>
                <td class="capitalize">{{ u.role }}</td>
                <td>{{ u.createdAt | date: 'd MMM y' }}</td>
                <td><app-status-badge [status]="u.isActive ? 'active' : 'blocked'" /></td>
                <td class="right">
                  @if (u.role !== 'admin' && u.id !== me()) {
                    <button type="button" class="btn btn-sm" [class.btn-outline-danger]="u.isActive" [class.btn-outline]="!u.isActive" (click)="toggle(u)">{{ u.isActive ? 'Block' : 'Unblock' }}</button>
                  }
                </td>
              </tr>
            } @empty { <tr><td colspan="6" class="muted">No users found.</td></tr> }
          </tbody>
        </table>
      </div>
      <app-pager [meta]="meta()" (go)="load($event)" />
    </div>
  `,
})
export class AdminUsers implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  protected me = computed(() => this.auth.user()?.id);
  protected items = signal<User[]>([]);
  protected meta = signal<PageMeta | null>(null);
  private filters = { q: '', role: '' };

  ngOnInit() { this.load(1); }

  apply(q: string, role: string) { this.filters = { q, role }; this.load(1); }

  load(page: number) {
    this.data.adminUsers({ ...this.filters, page }).subscribe((r) => { this.items.set(r.items); this.meta.set(r.meta); });
  }

  toggle(u: User) {
    if (u.isActive && !confirm(`Block ${u.name}? They will not be able to log in.`)) return;
    this.data.setUserStatus(u.id, !u.isActive).subscribe({
      next: (updated) => { this.items.update((list) => list.map((x) => (x.id === u.id ? updated : x))); this.toast.success(`${u.name} ${updated.isActive ? 'unblocked' : 'blocked'}`); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
