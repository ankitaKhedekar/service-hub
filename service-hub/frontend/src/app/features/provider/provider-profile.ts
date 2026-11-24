import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-provider-profile',
  imports: [ReactiveFormsModule],
  template: `
    <div class="stack-lg narrow-left">
      <h1>Profile</h1>
      <form class="card pad stack" [formGroup]="form" (ngSubmit)="save()">
        <div class="field">
          <label for="businessName">Business name</label>
          <input id="businessName" formControlName="businessName" />
        </div>
        <div class="form-grid">
          <div class="field"><label for="city">City</label><input id="city" formControlName="city" /></div>
          <div class="field"><label for="exp">Years of experience</label><input id="exp" type="number" min="0" formControlName="experienceYears" /></div>
          <div class="field"><label for="phone">Phone</label><input id="phone" type="tel" formControlName="phone" /></div>
        </div>
        <div class="field">
          <label for="bio">About your business</label>
          <textarea id="bio" rows="4" formControlName="bio"></textarea>
        </div>
        <button class="btn btn-primary" type="submit" [disabled]="saving() || form.invalid">{{ saving() ? 'Saving…' : 'Save profile' }}</button>
      </form>
    </div>
  `,
})
export class ProviderProfile implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);
  protected saving = signal(false);
  protected form = inject(FormBuilder).nonNullable.group({
    businessName: ['', [Validators.required, Validators.minLength(2)]],
    city: [''],
    experienceYears: [0, [Validators.min(0), Validators.max(60)]],
    phone: ['', Validators.pattern(/^[0-9+\-\s]{7,15}$/)],
    bio: ['', Validators.maxLength(1000)],
  });

  ngOnInit() {
    this.data.providerProfile().subscribe((p) => this.form.patchValue(p as Record<string, string | number>));
  }

  save() {
    this.saving.set(true);
    this.data.updateProviderProfile(this.form.getRawValue()).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Profile saved'); },
      error: (e) => { this.saving.set(false); this.toast.error(errorMessage(e)); },
    });
  }
}
