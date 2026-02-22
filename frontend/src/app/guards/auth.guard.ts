import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that redirects unauthenticated users to the OIDC login flow
 * via the BFF.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    // Auth check still in progress — wait briefly then re-evaluate.
    // In a real app you might return an Observable that waits for loading to finish.
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(() => {
        if (!authService.isLoading()) {
          clearInterval(interval);
          if (authService.isAuthenticated()) {
            resolve(true);
          } else {
            authService.login();
            resolve(false);
          }
        }
      }, 100);
    });
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Not authenticated: trigger OIDC login
  authService.login();
  return false;
};
