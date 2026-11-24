import { Component, computed, input } from '@angular/core';

const LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', rejected: 'Rejected',
  no_show: 'No-show', approved: 'Approved', active: 'Active', inactive: 'Inactive', blocked: 'Blocked',
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="'badge badge-' + status()">{{ label() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<string>();
  protected label = computed(() => LABELS[this.status()] ?? this.status());
}

export function statusLabel(status: string): string {
  return LABELS[status] ?? status;
}
