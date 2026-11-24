import { Component, OnInit, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { FaqList } from '../../shared/faq-list';
import { FAQ_GROUPS } from '../../content/site-content';

@Component({
  selector: 'app-faq',
  imports: [PageHero, FaqList, RouterLink],
  template: `
    <app-page-hero eyebrow="FAQ" title="Frequently asked questions" lead="Quick answers for customers and providers." />
    <section class="container section narrow-center stack-lg">
      <div class="tabs center-tabs" role="tablist" aria-label="Question groups">
        @for (g of groups; track g.id) {
          <button type="button" role="tab" class="tab" [class.active]="active() === g.id" [attr.aria-selected]="active() === g.id" (click)="active.set(g.id)">{{ g.title }}</button>
        }
      </div>
      @for (g of groups; track g.id) {
        @if (active() === g.id) { <app-faq-list [items]="g.items" /> }
      }
      <p class="center muted">Still have a question? <a routerLink="/contact">Contact us</a> or browse the <a routerLink="/help">help center</a>.</p>
    </section>
  `,
})
export class FaqPage implements OnInit {
  readonly topic = input<string>(); // ?topic=providers
  protected groups = FAQ_GROUPS;
  protected active = signal(FAQ_GROUPS[0].id);

  ngOnInit() {
    const t = this.topic();
    if (t && FAQ_GROUPS.some((g) => g.id === t)) this.active.set(t);
  }
}
