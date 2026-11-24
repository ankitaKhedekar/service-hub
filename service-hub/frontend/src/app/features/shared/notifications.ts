import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../core/data.service';
import { AppNotification } from '../../core/models';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  template: `
    <div class="container page narrow stack">
      <div class="row-between">
        <h1>Notifications</h1>
        @if (unread() > 0) { <button type="button" class="btn btn-outline btn-sm" (click)="readAll()">Mark all as read</button> }
      </div>
      @for (n of items(); track n.id) {
        <button type="button" class="card pad notice" [class.unread]="!n.isRead" (click)="open(n)">
          <span>{{ n.message }}</span>
          <span class="muted small">{{ n.createdAt | date }}</span>
        </button>
      } @empty {
        <div class="card pad empty">No notifications yet.</div>
      }
    </div>
  `,
})
export class Notifications implements OnInit {
  private data = inject(DataService);
  private router = inject(Router);
  protected items = signal<AppNotification[]>([]);
  protected unread = signal(0);

  ngOnInit() {
    this.data.notifications().subscribe((r) => { this.items.set(r.items); this.unread.set(r.unread); });
  }

  open(n: AppNotification) {
    if (!n.isRead) this.data.readNotification(n.id).subscribe();
    if (n.link) this.router.navigateByUrl(n.link);
    else this.items.update((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
  }

  readAll() {
    this.data.readAllNotifications().subscribe(() => {
      this.items.update((list) => list.map((x) => ({ ...x, isRead: true })));
      this.unread.set(0);
    });
  }
}
