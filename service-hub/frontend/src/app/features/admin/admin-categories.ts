import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { StatusBadge } from '../../shared/status-badge';
import { Category } from '../../core/models';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule, StatusBadge],
  template: `
    <div class="stack-lg">
      <h1>Categories</h1>
      <form class="card pad form-inline" [formGroup]="form" (ngSubmit)="save()">
        <div class="field grow">
          <label for="name">{{ editing() ? 'Rename category' : 'New category' }}</label>
          <input id="name" formControlName="name" placeholder="e.g. Pest control" />
        </div>
        <div class="field grow">
          <label for="desc">Description (optional)</label>
          <input id="desc" formControlName="description" />
        </div>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">{{ editing() ? 'Save' : 'Add' }}</button>
        @if (editing()) { <button class="btn btn-outline" type="button" (click)="reset()">Cancel</button> }
      </form>

      <div class="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Services</th><th>Status</th><th class="right">Actions</th></tr></thead>
          <tbody>
            @for (c of items(); track c.id) {
              <tr>
                <td><strong>{{ c.name }}</strong></td>
                <td class="mono">{{ c.slug }}</td>
                <td>{{ c.serviceCount }}</td>
                <td><app-status-badge [status]="c.isActive ? 'active' : 'inactive'" /></td>
                <td class="right">
                  <div class="btn-row nowrap end">
                    <button type="button" class="btn btn-outline btn-sm" (click)="edit(c)">Edit</button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="toggle(c)">{{ c.isActive ? 'Deactivate' : 'Activate' }}</button>
                    @if (!c.serviceCount) { <button type="button" class="btn btn-outline-danger btn-sm" (click)="remove(c)">Delete</button> }
                  </div>
                </td>
              </tr>
            } @empty { <tr><td colspan="5" class="muted">No categories yet.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminCategories implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);
  protected items = signal<Category[]>([]);
  protected editing = signal<Category | null>(null);
  protected form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    description: [''],
  });

  ngOnInit() { this.load(); }

  load() { this.data.adminCategories().subscribe((c) => this.items.set(c)); }

  edit(c: Category) { this.editing.set(c); this.form.setValue({ name: c.name, description: c.description ?? '' }); }

  reset() { this.editing.set(null); this.form.reset({ name: '', description: '' }); }

  save() {
    const c = this.editing();
    const body = { ...this.form.getRawValue(), isActive: c ? c.isActive : true };
    const req = c ? this.data.updateCategory(c.id, body) : this.data.createCategory(body);
    req.subscribe({
      next: () => { this.toast.success('Category saved'); this.reset(); this.load(); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  toggle(c: Category) {
    this.data.updateCategory(c.id, { name: c.name, description: c.description ?? '', isActive: !c.isActive }).subscribe({
      next: () => this.load(),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  remove(c: Category) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    this.data.deleteCategory(c.id).subscribe({
      next: () => { this.toast.success('Category deleted'); this.load(); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
