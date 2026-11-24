import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';
import { FaqList } from '../../shared/faq-list';
import { FAQ_GROUPS } from '../../content/site-content';

@Component({
  selector: 'app-for-providers',
  imports: [PageHero, Icon, FaqList, RouterLink],
  template: `
    <app-page-hero eyebrow="For service providers" title="Get more bookings without the phone calls" lead="Service Hub gives you an online booking calendar, a request inbox and an earnings dashboard, free to start.">
      <div class="btn-row">
        <a routerLink="/register" [queryParams]="{ role: 'provider' }" class="btn btn-primary">Become a provider</a>
        <a routerLink="/pricing" class="btn btn-outline">See plans</a>
      </div>
    </app-page-hero>

    <section class="container section stack-xl">
      @for (f of tools; track f.id; let odd = $odd) {
        <div class="alt-row" [class.reverse]="odd" [id]="f.id">
          <div class="stack">
            <span class="feature-ico"><app-icon [name]="f.icon" [size]="22" /></span>
            <h2 class="h2-lg">{{ f.title }}</h2>
            <p class="muted">{{ f.text }}</p>
            <ul class="check-list">
              @for (p of f.points; track p) { <li><app-icon name="check" [size]="18" /> {{ p }}</li> }
            </ul>
          </div>
          <div class="mock card">
            <div class="mock-head"><strong>{{ f.mockTitle }}</strong></div>
            @for (r of f.mockRows; track r[0]) {
              <div class="mock-row"><span class="small">{{ r[0] }}</span><strong class="small">{{ r[1] }}</strong></div>
            }
          </div>
        </div>
      }
    </section>

    <section class="section-band">
      <div class="container narrow-center stack-lg">
        <div class="center-head"><h2 class="h2-lg">Provider questions</h2></div>
        <app-faq-list [items]="faqs" />
      </div>
    </section>

    <section class="container section">
      <div class="cta-band">
        <div class="stack"><h2 class="h2-lg light">Ready to take your first booking?</h2><p>Create your provider account in a few minutes.</p></div>
        <a class="btn btn-light" routerLink="/register" [queryParams]="{ role: 'provider' }">Get started free</a>
      </div>
    </section>
  `,
})
export class ForProviders {
  protected faqs = FAQ_GROUPS[1].items;
  protected tools = [
    {
      id: 'calendar', icon: 'calendar', title: 'A booking calendar that follows your rules',
      text: 'Customers only see slots inside your working hours. Breaks, days off and existing bookings are taken out automatically.',
      points: ['Different hours for each day', 'Lunch breaks and leave days', '15, 30 or 60-minute slots', 'No double-booking, ever'],
      mockTitle: 'Your week', mockRows: [['Mon – Fri', '09:00 – 18:00'], ['Break', '13:00 – 14:00'], ['Saturday', '10:00 – 16:00'], ['Sunday', 'Closed']],
    },
    {
      id: 'requests', icon: 'bell', title: 'Every request, in one inbox',
      text: 'New bookings arrive as requests with the customer\'s address and notes. Accept the ones you can take.',
      points: ['Accept or reject in one click', 'Customer is notified instantly', 'Full status history on every booking'],
      mockTitle: 'New requests', mockRows: [['Rahul M. · Sat 3:00 PM', 'Pending'], ['Anita K. · Mon 10:00 AM', 'Pending'], ['Vikram S. · Mon 11:00 AM', 'Pending']],
    },
    {
      id: 'dashboard', icon: 'chart', title: 'Know how your business is doing',
      text: 'See today\'s schedule, pending requests and this month\'s earnings from completed jobs as soon as you log in.',
      points: ['Today\'s jobs in time order', 'Monthly earnings and job count', 'Mark completed or no-show'],
      mockTitle: 'This month', mockRows: [['Completed jobs', '31'], ['Earnings', '₹18,450'], ['Pending requests', '3']],
    },
    {
      id: 'reviews', icon: 'star', title: 'Build a reputation customers trust',
      text: 'Customers rate completed bookings. Your average rating shows on every service you offer.',
      points: ['One review per completed booking', 'Average rating on your profile', 'Recent reviews on your public page'],
      mockTitle: 'Your rating', mockRows: [['Average', '4.7 ★'], ['Reviews', '168'], ['Latest', '“On time and professional”']],
    },
  ];
}
