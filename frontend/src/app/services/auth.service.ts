import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UserInfo {
  authenticated: boolean;
  username?: string;
  name?: string;
  email?: string;
  roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userInfo = signal<UserInfo>({ authenticated: false });
  private loading = signal(true);

  readonly user = this.userInfo.asReadonly();
  readonly isAuthenticated = computed(() => this.userInfo().authenticated);
  readonly isLoading = computed(() => this.loading());

  constructor(private http: HttpClient) {}

  /**
   * Checks the current authentication status by calling the BFF.
   * Does NOT trigger a login redirect — just reads server-side session state.
   */
  checkAuth(): void {
    this.loading.set(true);
    this.http.get<UserInfo>('/bff/userinfo').subscribe({
      next: (info) => {
        this.userInfo.set(info);
        this.loading.set(false);
      },
      error: () => {
        this.userInfo.set({ authenticated: false });
        this.loading.set(false);
      },
    });
  }

  /**
   * Initiates OIDC login by navigating the browser to Spring Security's
   * OAuth2 authorization endpoint. The BFF will redirect to Keycloak.
   */
  login(): void {
    window.location.href = '/oauth2/authorization/keycloak';
  }

  /**
   * Logs out by POSTing to the BFF logout endpoint.
   * Spring Security will invalidate the session and redirect to Keycloak
   * for RP-Initiated Logout, then back to the application.
   */
  logout(): void {
    // Build and submit a form so the browser follows the redirect chain
    // (XHR cannot follow cross-origin redirects to Keycloak).
    const csrfToken = this.getCookie('XSRF-TOKEN');

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/bff/logout';

    if (csrfToken) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_csrf';
      input.value = csrfToken;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  private getCookie(name: string): string | null {
    const match = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  }
}
