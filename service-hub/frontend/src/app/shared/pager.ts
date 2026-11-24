import { Component, input, output } from '@angular/core';
import { PageMeta } from '../core/models';

@Component({
  selector: 'app-pager',
  template: `
    @if (meta(); as m) {
      @if (m.pages > 1) {
        <nav class="pager" aria-label="Pagination">
          <button type="button" class="btn btn-outline btn-sm" [disabled]="m.page <= 1" (click)="go.emit(m.page - 1)">Previous</button>
          <span class="muted">Page {{ m.page }} of {{ m.pages }}</span>
          <button type="button" class="btn btn-outline btn-sm" [disabled]="m.page >= m.pages" (click)="go.emit(m.page + 1)">Next</button>
        </nav>
      }
    }
  `,
})
export class Pager {
  readonly meta = input<PageMeta | null>(null);
  readonly go = output<number>();
}
