import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <section class="auth-aside">
        <a routerLink="/" class="brand-text light">Service Hub</a>
        <div class="stack">
          <h1 class="display light">One account for customers and professionals.</h1>
          <p>Customers book and track services. Providers manage bookings, services and working hours. Admins keep everything running.</p>
        </div>
        <div class="demo-box">
          <strong>Demo logins</strong>
          <span>Customer: customer&#64;demo.com</span>
          <span>Provider: provider&#64;demo.com</span>
          <span>Admin: admin&#64;demo.com</span>
          <span class="muted-light">Password: the SEED_PASSWORD you set in the backend .env</span>
        </div>
      </section>
      <section class="auth-main">
        <form class="card pad-lg auth-card stack" [formGroup]="form" (ngSubmit)="submit()">
          <h2>Log in</h2>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) { <span class="error">Enter a valid email</span> }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" autocomplete="current-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) { <span class="error">Enter your password</span> }
          </div>
          @if (error()) { <p class="alert alert-error" role="alert">{{ error() }}</p> }
          <button class="btn btn-primary block" type="submit" [disabled]="loading()">{{ loading() ? 'Logging in…' : 'Log in' }}</button>
          <p class="center small">New here? <a routerLink="/register">Create an account</a></p>
        </form>
      </section>
    </div>
  `,
})
export class Login {
  readonly returnUrl = input<string>(); // from ?returnUrl=
  private auth = inject(AuthService);
  private router = inject(Router);
  protected loading = signal(false);
  protected error = signal('');
  protected form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (s) => {
        const target = this.returnUrl() && this.returnUrl()!.startsWith('/') ? this.returnUrl()! : this.auth.homeFor(s.user.role);
        this.router.navigateByUrl(target);
      },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
