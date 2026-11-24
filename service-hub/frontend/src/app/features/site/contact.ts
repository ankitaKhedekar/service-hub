import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../shared/page-hero';
import { Icon } from '../../shared/icon';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-contact',
  imports: [PageHero, Icon, ReactiveFormsModule, RouterLink],
  template: `
    <app-page-hero eyebrow="Contact" title="Talk to our team" lead="Questions about a booking, your provider account or a partnership? Send us a message." />
    <section class="container section">
      <div class="split">
        <div class="main-col">
          @if (sent()) {
            <div class="card pad-lg stack center">
              <span class="feature-ico center-self"><app-icon name="check" [size]="26" /></span>
              <h2>Thanks, {{ sentName() }}! We got your message.</h2>
              <p class="muted">We'll reply to your email as soon as we can.</p>
              <a routerLink="/help" class="btn btn-outline center-self">Browse the help center meanwhile</a>
            </div>
          } @else {
            <form class="card pad-lg stack" [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-grid">
                <div class="field">
                  <label for="c-name">Your name</label>
                  <input id="c-name" formControlName="name" autocomplete="name" />
                  @if (bad('name')) { <span class="error">Enter your name</span> }
                </div>
                <div class="field">
                  <label for="c-email">Email</label>
                  <input id="c-email" type="email" formControlName="email" autocomplete="email" />
                  @if (bad('email')) { <span class="error">Enter a valid email</span> }
                </div>
              </div>
              <div class="field">
                <label for="c-topic">Topic</label>
                <select id="c-topic" formControlName="topic">
                  <option value="general">General question</option>
                  <option value="booking">A booking</option>
                  <option value="provider">Provider account</option>
                  <option value="partnership">Business plan or partnership</option>
                  <option value="other">Something else</option>
                </select>
              </div>
              <div class="field">
                <label for="c-msg">Message</label>
                <textarea id="c-msg" rows="6" formControlName="message"></textarea>
                @if (bad('message')) { <span class="error">Write at least 10 characters</span> }
              </div>
              <!-- Hidden from people; bots fill it in and get rejected -->
              <div class="hp" aria-hidden="true"><label for="c-web">Website</label><input id="c-web" formControlName="website" tabindex="-1" autocomplete="off" /></div>
              @if (error()) { <p class="alert alert-error" role="alert">{{ error() }}</p> }
              <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Send message' }}</button>
            </form>
          }
        </div>
        <aside class="side-col stack">
          <div class="card pad stack-xs"><app-icon name="help" /><strong>Help center</strong><span class="muted small">Most questions are answered in our guides.</span><a routerLink="/help">Browse guides</a></div>
          <div class="card pad stack-xs"><app-icon name="chat" /><strong>FAQ</strong><span class="muted small">Quick answers for customers and providers.</span><a routerLink="/faq">Read the FAQ</a></div>
          <div class="card pad stack-xs"><app-icon name="mail" /><strong>Email</strong><span class="muted small">support&#64;yourdomain.com</span></div>
        </aside>
      </div>
    </section>
  `,
})
export class Contact implements OnInit {
  readonly topic = input<string>(); // ?topic=partnership
  private data = inject(DataService);
  private auth = inject(AuthService);
  protected busy = signal(false);
  protected sent = signal(false);
  protected sentName = signal('');
  protected error = signal('');
  protected form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    topic: ['general'],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    website: [''],
  });

  ngOnInit() {
    const u = this.auth.user();
    if (u) this.form.patchValue({ name: u.name, email: u.email });
    const t = this.topic();
    if (t && ['general', 'booking', 'provider', 'partnership', 'other'].includes(t)) this.form.patchValue({ topic: t });
  }

  bad(name: 'name' | 'email' | 'message') {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.data.contact(v).subscribe({
      next: () => { this.sentName.set(v.name.split(' ')[0]); this.sent.set(true); this.busy.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.busy.set(false); },
    });
  }
}
