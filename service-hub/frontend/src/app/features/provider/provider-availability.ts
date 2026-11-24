import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { errorMessage } from '../../core/api.service';
import { Availability, DayHours } from '../../core/models';
import { dateInZone } from '../../core/time';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-provider-availability',
  imports: [ReactiveFormsModule],
  template: `
    <div class="stack-lg">
      <h1>Availability</h1>
      @if (loaded()) {
        <form class="stack-lg" [formGroup]="form" (ngSubmit)="save()">
          <section class="card pad stack">
            <div class="row-between">
              <h2>Weekly working hours</h2>
              <div class="field inline">
                <label for="interval">Slot every</label>
                <select id="interval" formControlName="slotIntervalMinutes">
                  <option [ngValue]="15">15 min</option><option [ngValue]="30">30 min</option><option [ngValue]="60">60 min</option>
                </select>
              </div>
            </div>
            <div class="table-wrap">
              <table formArrayName="weekly">
                <thead><tr><th>Day</th><th>Open</th><th>From</th><th>To</th><th>Break from</th><th>Break to</th></tr></thead>
                <tbody>
                  @for (day of weekly.controls; track $index) {
                    <tr [formGroupName]="$index">
                      <td><strong>{{ dayName($index) }}</strong></td>
                      <td><input type="checkbox" formControlName="isOpen" [attr.aria-label]="dayName($index) + ' open'" /></td>
                      <td><input type="time" formControlName="start" [attr.aria-label]="dayName($index) + ' opening time'" /></td>
                      <td><input type="time" formControlName="end" [attr.aria-label]="dayName($index) + ' closing time'" /></td>
                      <td><input type="time" formControlName="breakStart" [attr.aria-label]="dayName($index) + ' break start'" /></td>
                      <td><input type="time" formControlName="breakEnd" [attr.aria-label]="dayName($index) + ' break end'" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="muted small">Leave both break fields empty for no break.</p>
          </section>

          <section class="card pad stack">
            <h2>Leave and blocked dates</h2>
            <div class="btn-row">
              <div class="field inline">
                <label for="leave">Add a day off</label>
                <input id="leave" type="date" [min]="today" #leave />
              </div>
              <button type="button" class="btn btn-outline" (click)="addLeave(leave.value); leave.value = ''">Add</button>
            </div>
            <ul class="leave-list">
              @for (d of leaves(); track d) {
                <li><span>{{ d }}</span><button type="button" class="link-danger" (click)="removeLeave(d)" [attr.aria-label]="'Remove ' + d">Remove</button></li>
              } @empty { <li class="muted">No days off added.</li> }
            </ul>
            <p class="alert alert-info small">Customers only see slots inside your hours, outside breaks and leave days, and not already booked.</p>
          </section>

          <button class="btn btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save availability' }}</button>
        </form>
      } @else {
        <p class="muted">Loading…</p>
      }
    </div>
  `,
})
export class ProviderAvailability implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  protected loaded = signal(false);
  protected saving = signal(false);
  protected leaves = signal<string[]>([]);
  protected today = dateInZone(new Date());

  protected form = this.fb.nonNullable.group({
    slotIntervalMinutes: [60 as 15 | 30 | 60],
    weekly: this.fb.array<FormGroup>([]),
  });

  get weekly() { return this.form.controls.weekly as FormArray<FormGroup>; }

  dayName(i: number) { return DAY_NAMES[(this.weekly.at(i).value as DayHours).day]; }

  ngOnInit() {
    this.data.availability().subscribe({
      next: (a) => this.fill(a),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  addLeave(value: string) {
    if (!value || this.leaves().includes(value)) return;
    this.leaves.update((l) => [...l, value].sort());
  }

  removeLeave(d: string) { this.leaves.update((l) => l.filter((x) => x !== d)); }

  save() {
    const v = this.form.getRawValue();
    const body: Availability = {
      slotIntervalMinutes: v.slotIntervalMinutes,
      leaves: this.leaves(),
      weekly: (v.weekly as DayHours[]).map((d) => ({ ...d, breakStart: d.breakStart || null, breakEnd: d.breakEnd || null })),
    };
    this.saving.set(true);
    this.data.saveAvailability(body).subscribe({
      next: (a) => { this.fill(a); this.saving.set(false); this.toast.success('Availability saved'); },
      error: (e) => { this.saving.set(false); this.toast.error(errorMessage(e)); },
    });
  }

  private fill(a: Availability) {
    this.form.controls.slotIntervalMinutes.setValue(a.slotIntervalMinutes);
    this.weekly.clear();
    [...a.weekly].sort((x, y) => x.day - y.day).forEach((d) =>
      this.weekly.push(this.fb.nonNullable.group({
        day: [d.day], isOpen: [d.isOpen], start: [d.start], end: [d.end], breakStart: [d.breakStart ?? ''], breakEnd: [d.breakEnd ?? ''],
      }))
    );
    this.leaves.set(a.leaves ?? []);
    this.loaded.set(true);
  }
}
