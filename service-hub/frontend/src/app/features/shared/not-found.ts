import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="container page narrow center stack">
      <h1>Page not found</h1>
      <p class="muted">The page you are looking for does not exist.</p>
      <a routerLink="/" class="btn btn-primary">Go home</a>
    </div>
  `,
})
export class NotFound {}
