import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <section class="auth-aside">
        <a routerLink="/" class="brand-text light">Service Hub</a>
        <div class="stack">
          <h1 class="display light">Create your account.</h1>
          <p>Book trusted professionals, or list your own services and start getting bookings.</p>
        </div>
        <span></span>
      </section>
      <section class="auth-main">
        <form class="card pad-lg auth-card stack" [formGroup]="form" (ngSubmit)="submit()">
          <h2>Register</h2>
          <div class="role-pick" role="radiogroup" aria-label="Account type">
            <button type="button" role="radio" class="role-card" [class.selected]="isProvider() === false" [attr.aria-checked]="!isProvider()" (click)="setRole('customer')">
              <strong>Book services</strong><span class="muted small">Customer</span>
            </button>
            <button type="button" role="radio" class="role-card" [class.selected]="isProvider()" [attr.aria-checked]="isProvider()" (click)="setRole('provider')">
              <strong>Offer services</strong><span class="muted small">Provider</span>
            </button>
          </div>

          <div class="field">
            <label for="name">Full name</label>
            <input id="name" formControlName="name" autocomplete="name" />
            @if (invalid('name')) { <span class="error">Enter your name</span> }
          </div>
          @if (isProvider()) {
            <div class="field">
              <label for="businessName">Business name</label>
              <input id="businessName" formControlName="businessName" />
              @if (invalid('businessName')) { <span class="error">Enter your business name</span> }
            </div>
            <div class="field">
              <label for="city">City</label>
              <input id="city" formControlName="city" />
            </div>
          }
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" />
            @if (invalid('email')) { <span class="error">Enter a valid email</span> }
          </div>
          <div class="field">
            <label for="phone">Phone (optional)</label>
            <input id="phone" type="tel" formControlName="phone" autocomplete="tel" />
            @if (invalid('phone')) { <span class="error">Enter 7 to 15 digits</span> }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" autocomplete="new-password" />
            @if (invalid('password')) { <span class="error">At least 8 characters with letters and numbers</span> }
          </div>
          @if (isProvider()) {
            <p class="alert alert-warn small">Provider accounts are reviewed by an admin before your services go live.</p>
          }
          @if (error()) { <p class="alert alert-error" role="alert">{{ error() }}</p> }
          <button class="btn btn-primary block" type="submit" [disabled]="loading()">{{ loading() ? 'Creating account…' : 'Create account' }}</button>
          <p class="center small">Already registered? <a routerLink="/login">Log in</a></p>
        </form>
      </section>
    </div>
  `,
})
export class Register implements OnInit {
  readonly role = input<string>(); // ?role=provider
  private auth = inject(AuthService);
  private router = inject(Router);
  protected isProvider = signal(false);
  protected loading = signal(false);
  protected error = signal('');
  protected form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    businessName: [''],
    city: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(/^[0-9+\-\s]{7,15}$/)],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
  });

  ngOnInit() {
    this.setRole(this.role() === 'provider' ? 'provider' : 'customer');
  }

  setRole(role: 'customer' | 'provider') {
    this.isProvider.set(role === 'provider');
    const biz = this.form.controls.businessName;
    biz.setValidators(role === 'provider' ? [Validators.required, Validators.minLength(2)] : []);
    biz.updateValueAndValidity();
  }

  invalid(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    const role = this.isProvider() ? 'provider' : 'customer';
    this.auth.register({
      name: v.name, email: v.email, phone: v.phone, password: v.password, role,
      ...(role === 'provider' ? { businessName: v.businessName, city: v.city } : {}),
    }).subscribe({
      next: (s) => this.router.navigateByUrl(this.auth.homeFor(s.user.role)),
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
