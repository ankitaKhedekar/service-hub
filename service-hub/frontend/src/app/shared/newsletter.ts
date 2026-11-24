import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { errorMessage } from '../core/api.service';

@Component({
  selector: 'app-newsletter',
  imports: [ReactiveFormsModule],
  template: `
    <section class="newsletter">
      <div class="container newsletter-row">
        <div class="stack-xs">
          <h2>Tips and offers, once a month</h2>
          <p class="muted">Home care tips, seasonal reminders and new services near you. No spam.</p>
        </div>
        @if (done()) {
          <p class="alert alert-success" role="status">Thanks! You're subscribed.</p>
        } @else {
          <form class="newsletter-form" [formGroup]="form" (ngSubmit)="submit()">
            <label for="nl-email" class="sr-only">Email address</label>
            <input id="nl-email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" />
            <button class="btn btn-primary" type="submit" [disabled]="busy()">Subscribe</button>
            @if (error()) { <span class="error full">{{ error() }}</span> }
          </form>
        }
      </div>
    </section>
  `,
})
export class Newsletter {
  private data = inject(DataService);
  protected form = inject(FormBuilder).nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  protected busy = signal(false);
  protected done = signal(false);
  protected error = signal('');

  submit() {
    if (this.form.invalid) { this.error.set('Enter a valid email address'); return; }
    this.busy.set(true);
    this.error.set('');
    this.data.subscribe(this.form.getRawValue().email).subscribe({
      next: () => { this.done.set(true); this.busy.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.busy.set(false); },
    });
  }
}
