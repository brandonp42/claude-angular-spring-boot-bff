import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToolbarComponent],
  template: `
    <app-toolbar />
    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .content {
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }
  `],
})
export class AppComponent {
  private authService = inject(AuthService);

  constructor() {
    // Eagerly check auth status on app init
    this.authService.checkAuth();
  }
}
