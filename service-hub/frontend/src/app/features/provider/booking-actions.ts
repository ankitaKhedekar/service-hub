import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { Booking, BookingStatus } from '../../core/models';

/** The status buttons a provider or admin sees for one booking. Mirrors the server's rules. */
@Component({
  selector: 'app-booking-actions',
  template: `
    <div class="btn-row nowrap">
      @for (a of actions(); track a.to) {
        <button type="button" class="btn btn-sm" [class]="'btn btn-sm ' + a.css" [disabled]="busy()" (click)="run(a.to)">{{ a.label }}</button>
      } @empty {
        <span class="muted small">No actions</span>
      }
    </div>
  `,
})
export class BookingActions {
  readonly booking = input.required<Booking>();
  readonly changed = output<Booking>();
  private data = inject(DataService);
  private toast = inject(ToastService);
  protected busy = signal(false);

  protected actions = computed(() => {
    const b = this.booking();
    const started = new Date(b.startTime).getTime() <= Date.now();
    if (b.status === 'pending') {
      return [{ to: 'rejected', label: 'Reject', css: 'btn-outline-danger' }, { to: 'confirmed', label: 'Accept', css: 'btn-primary' }];
    }
    if (b.status === 'confirmed') {
      return started
        ? [{ to: 'no_show', label: 'No-show', css: 'btn-outline' }, { to: 'completed', label: 'Mark completed', css: 'btn-primary' }]
        : [{ to: 'cancelled', label: 'Cancel', css: 'btn-outline-danger' }];
    }
    return [];
  });

  run(to: string) {
    this.busy.set(true);
    this.data.changeStatus(this.booking().id, to as BookingStatus).subscribe({
      next: (b) => { this.busy.set(false); this.toast.success(`Booking ${b.code} updated`); this.changed.emit(b); },
      error: (e) => { this.busy.set(false); this.toast.error(errorMessage(e)); },
    });
  }
}
