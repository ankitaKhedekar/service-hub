import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { StatusBadge } from '../../shared/status-badge';
import { Pager } from '../../shared/pager';
import { AdminProvider, PageMeta } from '../../core/models';

@Component({
  selector: 'app-admin-providers',
  imports: [DatePipe, DecimalPipe, StatusBadge, Pager],
  template: `
    <div class="stack-lg">
      <h1>Providers</h1>
      <div class="tabs" role="tablist">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" class="tab" [class.active]="tab() === t.key" [attr.aria-selected]="tab() === t.key" (click)="select(t.key)">{{ t.label }}</button>
        }
      </div>
      <div class="grid cards-3">
        @for (p of items(); track p.id) {
          <article class="card pad stack">
            <div class="row-between">
              <div>
                <strong>{{ p.businessName }}</strong>
                <div class="muted small">{{ p.city || 'No city' }} · {{ p.experienceYears }} years</div>
              </div>
              <app-status-badge [status]="p.approvalStatus" />
            </div>
            <dl class="summary small">
              <dt>Owner</dt><dd>{{ p.owner?.name }}</dd>
              <dt>Email</dt><dd>{{ p.owner?.email }}</dd>
              <dt>Services</dt><dd>{{ p.serviceCount }}</dd>
              <dt>Rating</dt><dd>{{ p.totalReviews ? (p.avgRating | number: '1.1-1') + ' (' + p.totalReviews + ')' : '-' }}</dd>
              <dt>Applied</dt><dd>{{ p.appliedAt | date: 'd MMM y' }}</dd>
            </dl>
            @if (p.bio) { <p class="small">{{ p.bio }}</p> }
            <div class="btn-row">
              @if (p.approvalStatus !== 'rejected') { <button type="button" class="btn btn-outline-danger grow" [disabled]="busy()" (click)="decide(p, 'rejected')">Reject</button> }
              @if (p.approvalStatus !== 'approved') { <button type="button" class="btn btn-primary grow" [disabled]="busy()" (click)="decide(p, 'approved')">Approve</button> }
            </div>
          </article>
        } @empty {
          <div class="card pad empty">No {{ tab() || '' }} providers.</div>
        }
      </div>
      <app-pager [meta]="meta()" (go)="load($event)" />
    </div>
  `,
})
export class AdminProviders implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);
  protected tabs = [{ key: 'pending', label: 'Waiting' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: '', label: 'All' }];
  protected tab = signal('pending');
  protected items = signal<AdminProvider[]>([]);
  protected meta = signal<PageMeta | null>(null);
  protected busy = signal(false);

  ngOnInit() { this.load(1); }

  select(key: string) { this.tab.set(key); this.load(1); }

  load(page: number) {
    this.data.adminProviders({ status: this.tab(), page }).subscribe((r) => { this.items.set(r.items); this.meta.set(r.meta); });
  }

  decide(p: AdminProvider, status: 'approved' | 'rejected') {
    const note = status === 'rejected' ? prompt('Reason for rejecting (shown to the provider):') ?? '' : '';
    this.busy.set(true);
    this.data.setApproval(p.id, status, note).subscribe({
      next: () => { this.busy.set(false); this.toast.success(`${p.businessName} ${status}`); this.load(this.meta()?.page ?? 1); },
      error: (e) => { this.busy.set(false); this.toast.error(errorMessage(e)); },
    });
  }
}
