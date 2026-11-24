import { Component, input } from '@angular/core';
import { Faq } from '../content/site-content';

/** Accordion built on native <details>, so it works with keyboard and screen readers out of the box. */
@Component({
  selector: 'app-faq-list',
  template: `
    <div class="faq-list">
      @for (f of items(); track f.q) {
        <details class="faq-item">
          <summary>{{ f.q }}</summary>
          <p>{{ f.a }}</p>
        </details>
      }
    </div>
  `,
})
export class FaqList {
  readonly items = input.required<Faq[]>();
}
