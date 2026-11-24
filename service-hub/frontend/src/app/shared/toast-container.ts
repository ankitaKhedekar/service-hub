import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast toast-' + t.kind" role="status">
          <span>{{ t.text }}</span>
          <button type="button" class="toast-close" (click)="toast.dismiss(t.id)" aria-label="Dismiss">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected toast = inject(ToastService);
}
