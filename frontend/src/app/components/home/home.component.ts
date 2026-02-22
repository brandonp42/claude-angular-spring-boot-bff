import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Welcome</mat-card-title>
        <mat-card-subtitle>Angular + Spring Boot BFF with OIDC</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p>
          This application demonstrates the
          <strong>Backend for Frontend (BFF)</strong> pattern using Angular and
          Spring Cloud Gateway with Keycloak as the OIDC identity provider.
        </p>

        <ul>
          <li>The BFF manages the OAuth2 session — no tokens in the browser.</li>
          <li>CSRF protection via cookie-based tokens.</li>
          <li>Spring Cloud Gateway proxies API requests with TokenRelay.</li>
          <li>Sessions are stored in Redis for scalability.</li>
        </ul>

        @if (auth.isAuthenticated()) {
          <p>You are signed in as <strong>{{ auth.user().name }}</strong>.</p>
        } @else {
          <p>You are not signed in. Click <strong>Login</strong> to authenticate via Keycloak.</p>
        }
      </mat-card-content>

      <mat-card-actions>
        @if (auth.isAuthenticated()) {
          <a mat-raised-button color="primary" routerLink="/protected">
            <mat-icon>lock_open</mat-icon> Go to Protected Page
          </a>
        } @else {
          <button mat-raised-button color="primary" (click)="auth.login()">
            <mat-icon>login</mat-icon> Login with Keycloak
          </button>
        }
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 640px;
      margin: 32px auto;
    }
    ul {
      margin: 16px 0;
    }
    li {
      margin-bottom: 8px;
    }
  `],
})
export class HomeComponent {
  auth = inject(AuthService);
}
