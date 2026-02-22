import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <span routerLink="/" class="app-title">Angular BFF App</span>

      <span class="spacer"></span>

      <a mat-button routerLink="/">Home</a>
      <a mat-button routerLink="/protected">Protected</a>

      <span class="spacer"></span>

      @if (auth.isAuthenticated()) {
        <span class="username">{{ auth.user().username }}</span>
        <button mat-button (click)="auth.logout()">
          <mat-icon>logout</mat-icon> Logout
        </button>
      } @else {
        <button mat-raised-button (click)="auth.login()">
          <mat-icon>login</mat-icon> Login
        </button>
      }
    </mat-toolbar>
  `,
  styles: [`
    .app-title {
      cursor: pointer;
      font-weight: 500;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .username {
      margin-right: 8px;
      font-size: 14px;
    }
  `],
})
export class ToolbarComponent {
  auth = inject(AuthService);
}
