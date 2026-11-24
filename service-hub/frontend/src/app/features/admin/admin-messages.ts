import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { Pager } from '../../shared/pager';
import { ContactMessage, PageMeta } from '../../core/models';

@Component({
  selector: 'app-admin-messages',
  imports: [DatePipe, Pager],
  template: `
    <div class="stack-lg">
      <div class="row-between">
        <h1>Messages</h1>
        <span class="muted">{{ subscribers() }} newsletter subscribers</span>
      </div>
      <div class="tabs" role="tablist">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" class="tab" [class.active]="tab() === t.key" [attr.aria-selected]="tab() === t.key" (click)="select(t.key)">{{ t.label }}</button>
        }
      </div>
      <div class="stack">
        @for (m of items(); track m.id) {
          <article class="card pad stack-xs">
            <div class="row-between">
              <div><strong>{{ m.name }}</strong> <a class="small" [href]="'mailto:' + m.email">{{ m.email }}</a></div>
              <span class="muted small">{{ m.createdAt | date }}</span>
            </div>
            <span class="chip chip-blue">{{ m.topic }}</span>
            <p class="pre">{{ m.message }}</p>
            <div class="btn-row">
              @if (m.status !== 'replied') { <button type="button" class="btn btn-outline btn-sm" (click)="set(m, 'replied')">Mark replied</button> }
              @if (m.status !== 'closed') { <button type="button" class="btn btn-outline btn-sm" (click)="set(m, 'closed')">Close</button> }
              @if (m.status !== 'new') { <button type="button" class="btn btn-outline btn-sm" (click)="set(m, 'new')">Reopen</button> }
            </div>
          </article>
        } @empty { <div class="card pad empty">No messages here.</div> }
      </div>
      <app-pager [meta]="meta()" (go)="load($event)" />
    </div>
  `,
})
export class AdminMessages implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);
  protected tabs = [{ key: 'new', label: 'New' }, { key: 'replied', label: 'Replied' }, { key: 'closed', label: 'Closed' }, { key: '', label: 'All' }];
  protected tab = signal('new');
  protected items = signal<ContactMessage[]>([]);
  protected meta = signal<PageMeta | null>(null);
  protected subscribers = signal(0);

  ngOnInit() { this.load(1); }

  select(key: string) { this.tab.set(key); this.load(1); }

  load(page: number) {
    this.data.adminMessages({ status: this.tab(), page }).subscribe((r) => {
      this.items.set(r.items);
      this.meta.set(r.meta);
      this.subscribers.set((r.meta as PageMeta & { subscribers?: number }).subscribers ?? 0);
    });
  }

  set(m: ContactMessage, status: ContactMessage['status']) {
    this.data.setMessageStatus(m.id, status).subscribe({
      next: () => { this.toast.success('Message updated'); this.load(this.meta()?.page ?? 1); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
