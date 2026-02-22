import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-protected',
  standalone: true,
  imports: [MatCardModule, MatListModule, MatIconModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar>verified_user</mat-icon>
        <mat-card-title>Protected Page</mat-card-title>
        <mat-card-subtitle>Only visible to authenticated users</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p>
          If you can see this page, you have been successfully authenticated
          through the BFF's OIDC flow.
        </p>

        <mat-list>
          <mat-list-item>
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>Username</span>
            <span matListItemLine>{{ auth.user().username }}</span>
          </mat-list-item>

          <mat-list-item>
            <mat-icon matListItemIcon>badge</mat-icon>
            <span matListItemTitle>Full Name</span>
            <span matListItemLine>{{ auth.user().name }}</span>
          </mat-list-item>

          <mat-list-item>
            <mat-icon matListItemIcon>email</mat-icon>
            <span matListItemTitle>Email</span>
            <span matListItemLine>{{ auth.user().email }}</span>
          </mat-list-item>

          <mat-list-item>
            <mat-icon matListItemIcon>security</mat-icon>
            <span matListItemTitle>Roles</span>
            <span matListItemLine>{{ auth.user().roles?.join(', ') }}</span>
          </mat-list-item>
        </mat-list>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 640px;
      margin: 32px auto;
    }
    mat-icon[mat-card-avatar] {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
  `],
})
export class ProtectedComponent {
  auth = inject(AuthService);
}
