import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceCard } from '../../shared/service-card';
import { Pager } from '../../shared/pager';
import { DataService } from '../../core/data.service';
import { errorMessage } from '../../core/api.service';
import { Category, PageMeta, ServiceItem } from '../../core/models';

@Component({
  selector: 'app-service-list',
  imports: [ServiceCard, Pager, ReactiveFormsModule],
  template: `
    <div class="container page">
      <h1>Services</h1>
      <form class="filters card pad" [formGroup]="filters" (ngSubmit)="apply()">
        <div class="field grow">
          <label for="q">Search</label>
          <input id="q" formControlName="q" placeholder="Service name" />
        </div>
        <div class="field">
          <label for="category">Category</label>
          <select id="category" formControlName="category" (change)="apply()">
            <option value="">All categories</option>
            @for (c of categories(); track c.id) { <option [value]="c.slug">{{ c.name }}</option> }
          </select>
        </div>
        <div class="field">
          <label for="city">City</label>
          <input id="city" formControlName="city" placeholder="Any city" />
        </div>
        <div class="field">
          <label for="sort">Sort by</label>
          <select id="sort" formControlName="sort" (change)="apply()">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
        <button class="btn btn-primary" type="submit">Apply</button>
      </form>

      @if (error()) { <p class="alert alert-error">{{ error() }}</p> }
      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else {
        <p class="muted small">{{ meta()?.total ?? 0 }} services found</p>
        <div class="grid services">
          @for (s of services(); track s.id) { <app-service-card [service]="s" /> }
          @empty { <div class="empty card pad">No services match your filters. Try clearing the search.</div> }
        </div>
        <app-pager [meta]="meta()" (go)="toPage($event)" />
      }
    </div>
  `,
})
export class ServiceList implements OnInit {
  private data = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected categories = signal<Category[]>([]);
  protected services = signal<ServiceItem[]>([]);
  protected meta = signal<PageMeta | null>(null);
  protected loading = signal(true);
  protected error = signal('');
  protected filters = inject(FormBuilder).nonNullable.group({ q: '', category: '', city: '', sort: 'newest' });

  ngOnInit() {
    this.data.categories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    // The URL is the source of truth, so filters survive refresh and can be shared
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      const f = { q: p.get('q') ?? '', category: p.get('category') ?? '', city: p.get('city') ?? '', sort: p.get('sort') ?? 'newest' };
      this.filters.setValue(f, { emitEvent: false });
      this.load({ ...f, page: Number(p.get('page')) || 1 });
    });
  }

  apply() {
    const f = this.filters.getRawValue();
    this.router.navigate([], { queryParams: { q: f.q || null, category: f.category || null, city: f.city || null, sort: f.sort === 'newest' ? null : f.sort, page: null } });
  }

  toPage(page: number) {
    this.router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });
  }

  private load(params: { q: string; category: string; city: string; sort: string; page: number }) {
    this.loading.set(true);
    this.error.set('');
    this.data.services({ ...params, limit: 12 }).subscribe({
      next: (r) => { this.services.set(r.items); this.meta.set(r.meta); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
