import { Component, input } from '@angular/core';

/** Coloured banner at the top of content pages. Extra content (buttons, search) goes inside. */
@Component({
  selector: 'app-page-hero',
  template: `
    <section class="page-hero">
      <div class="container stack">
        @if (eyebrow()) { <span class="eyebrow">{{ eyebrow() }}</span> }
        <h1>{{ title() }}</h1>
        @if (lead()) { <p class="lead">{{ lead() }}</p> }
        <ng-content />
      </div>
    </section>
  `,
})
export class PageHero {
  readonly title = input.required<string>();
  readonly lead = input('');
  readonly eyebrow = input('');
}
