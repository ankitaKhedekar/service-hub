import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ToastContainer } from './shared/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  template: `
    <router-outlet />
    <app-toast-container />
  `,
})
export class App {
  constructor() {
    // Pick up role / approval changes made while the user was away
    inject(AuthService).refresh();
  }
}
