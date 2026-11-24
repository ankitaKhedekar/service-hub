import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { StatusBadge } from '../../shared/status-badge';
import { Category, ServiceItem } from '../../core/models';

@Component({
  selector: 'app-provider-services',
  imports: [ReactiveFormsModule, CurrencyPipe, StatusBadge],
  template: `
    <div class="stack-lg">
      <div class="row-between">
        <h1>My services</h1>
        @if (!showForm()) { <button type="button" class="btn btn-primary" (click)="startNew()">+ Add service</button> }
      </div>

      @if (showForm()) {
        <form class="card pad stack" [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ editingId() ? 'Edit service' : 'New service' }}</h2>
          <div class="form-grid">
            <div class="field">
              <label for="title">Title</label>
              <input id="title" formControlName="title" />
              @if (form.controls.title.touched && form.controls.title.invalid) { <span class="error">At least 3 characters</span> }
            </div>
            <div class="field">
              <label for="categoryId">Category</label>
              <select id="categoryId" formControlName="categoryId">
                <option value="" disabled>Choose a category</option>
                @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
              @if (form.controls.categoryId.touched && form.controls.categoryId.invalid) { <span class="error">Choose a category</span> }
            </div>
            <div class="field">
              <label for="price">Price (₹)</label>
              <input id="price" type="number" min="0" formControlName="price" />
              @if (form.controls.price.touched && form.controls.price.invalid) { <span class="error">Enter a price of 0 or more</span> }
            </div>
            <div class="field">
              <label for="duration">Duration</label>
              <select id="duration" formControlName="durationMinutes">
                @for (d of durations; track d) { <option [ngValue]="d">{{ d }} minutes</option> }
              </select>
            </div>
          </div>
          <div class="field">
            <label for="description">Description</label>
            <textarea id="description" rows="3" formControlName="description"></textarea>
          </div>
          <label class="check"><input type="checkbox" formControlName="isActive" /> Visible to customers</label>
          <div class="btn-row">
            <button class="btn btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save service' }}</button>
            <button class="btn btn-outline" type="button" (click)="showForm.set(false)">Cancel</button>
          </div>
        </form>
      }

      <div class="stack">
        @for (s of services(); track s.id) {
          <div class="card pad list-row">
            <div class="grow">
              <strong>{{ s.title }}</strong>
              <div class="muted small">{{ s.category?.name }} · {{ s.durationMinutes }} min</div>
            </div>
            <strong>{{ s.price | currency: 'INR' : 'symbol' : '1.0-0' }}</strong>
            <app-status-badge [status]="s.isActive ? 'active' : 'inactive'" />
            <button type="button" class="btn btn-outline btn-sm" (click)="edit(s)">Edit</button>
            <button type="button" class="btn btn-outline-danger btn-sm" (click)="remove(s)">Delete</button>
          </div>
        } @empty {
          <div class="card pad empty">You have no services yet. Add your first service to start getting bookings.</div>
        }
      </div>
    </div>
  `,
})
export class ProviderServices implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);
  protected services = signal<ServiceItem[]>([]);
  protected categories = signal<Category[]>([]);
  protected showForm = signal(false);
  protected editingId = signal<string | null>(null);
  protected saving = signal(false);
  protected durations = [30, 45, 60, 90, 120, 180, 240];

  protected form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    categoryId: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    durationMinutes: [60, Validators.required],
    description: ['', Validators.maxLength(2000)],
    isActive: [true],
  });

  ngOnInit() {
    this.data.categories().subscribe((c) => this.categories.set(c));
    this.load();
  }

  load() { this.data.providerServices().subscribe((s) => this.services.set(s)); }

  startNew() {
    this.editingId.set(null);
    this.form.reset({ title: '', categoryId: '', price: 0, durationMinutes: 60, description: '', isActive: true });
    this.showForm.set(true);
  }

  edit(s: ServiceItem) {
    this.editingId.set(s.id);
    this.form.reset({ title: s.title, categoryId: s.category?.id ?? '', price: s.price, durationMinutes: s.durationMinutes, description: s.description, isActive: s.isActive });
    this.showForm.set(true);
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const body = this.form.getRawValue();
    const id = this.editingId();
    const req = id ? this.data.updateService(id, body) : this.data.createService(body);
    req.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.toast.success('Service saved'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(errorMessage(e)); },
    });
  }

  remove(s: ServiceItem) {
    if (!confirm(`Delete "${s.title}"?`)) return;
    this.data.deleteService(s.id).subscribe({
      next: (r) => { this.toast.success(r.message ?? 'Service deleted'); this.load(); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
