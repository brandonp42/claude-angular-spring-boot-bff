# Angular + Spring Boot BFF with OIDC

A full-stack application demonstrating the **Backend for Frontend (BFF)** pattern:

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19, Angular Material |
| BFF | Spring Boot 3.4, Spring Cloud Gateway (reactive) |
| Auth | Keycloak 26 (OIDC / OAuth 2.0) |
| Session Store | Redis 7 |
| Containers | Podman / podman-compose |

## Architecture

```
Browser ──► BFF (Spring Cloud Gateway :8080)
              │
              ├── /bff/*          → BFF controllers (userinfo, logout)
              ├── /oauth2/*       → Spring Security OIDC flow
              ├── /api/*          → Downstream APIs (with TokenRelay)
              └── /**             → Angular frontend (:4200 dev / :80 prod)
              │
              └── Redis (session store)
              │
              └── Keycloak (:9090) ← OIDC Provider
```

The BFF is the **single entry point** for the browser. It:

1. Manages the OIDC authorization code flow with Keycloak
2. Stores the OAuth2 session in Redis (HTTP-only session cookie)
3. Proxies frontend assets from the Angular container
4. Relays API requests to downstream services, attaching the access token (`TokenRelay` filter)
5. Provides CSRF protection via `XSRF-TOKEN` cookie (compatible with Angular's `HttpClient`)

**No tokens are ever exposed to the browser.**

---

## Prerequisites

- **Podman** and **podman-compose** (or Docker / docker-compose)
- **Java 21** and **Maven 3.9+** (for local BFF development)
- **Node.js 22+** and **npm** (for local Angular development)

---

## Quick Start (full compose)

Start everything in containers:

```bash
podman-compose up --build
```

Then open **http://localhost:8080** in your browser.

| Service | URL |
|---------|-----|
| Application | http://localhost:8080 |
| Keycloak Admin | http://localhost:9090 (admin / admin) |

### Test Users

| Username | Password | Roles |
|----------|----------|-------|
| testuser | password | user |
| admin | password | user, admin |

---

## Local Development (recommended for fast iteration)

Run only Keycloak and Redis in containers, and the BFF + Angular natively on your machine:

### 1. Start infrastructure

```bash
podman-compose -f podman-compose.infra.yml up -d
```

### 2. Start the BFF

```bash
cd bff
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The BFF starts on **http://localhost:8080** and proxies frontend requests to `http://localhost:4200`.

### 3. Start Angular

```bash
cd frontend
npm install
npm run start
```

Angular dev server starts on port 4200. Open **http://localhost:8080** (the BFF) in your browser.

> **Note:** Always access the app through the BFF (port 8080), not the Angular dev server directly, so that OIDC login and session cookies work correctly.

### Alternative: Angular with proxy (without BFF)

For pure frontend work where you don't need OIDC, you can access Angular directly:

```bash
npm run start:proxy
```

This uses `proxy.conf.json` to forward `/bff/*`, `/api/*`, `/oauth2/*`, and `/login/*` to the BFF.

---

## Project Structure

```
├── podman-compose.yml           # Full compose (all services)
├── podman-compose.infra.yml     # Infrastructure only (Keycloak + Redis)
├── keycloak/
│   └── realm-export.json        # Pre-configured realm, clients, users
├── bff/
│   ├── pom.xml
│   ├── Containerfile
│   └── src/main/
│       ├── java/com/example/bff/
│       │   ├── BffApplication.java
│       │   ├── config/SecurityConfig.java
│       │   └── controller/BffController.java
│       └── resources/
│           ├── application.yml          # Shared config
│           ├── application-compose.yml  # Container overrides
│           └── application-local.yml    # Local dev overrides
└── frontend/
    ├── package.json
    ├── angular.json
    ├── proxy.conf.json              # Dev proxy → BFF
    ├── Containerfile                # Production (nginx)
    ├── Containerfile.dev            # Development (ng serve)
    ├── nginx.conf
    └── src/app/
        ├── app.component.ts
        ├── app.config.ts
        ├── app.routes.ts
        ├── services/auth.service.ts
        ├── guards/auth.guard.ts
        └── components/
            ├── home/home.component.ts
            ├── protected/protected.component.ts
            └── toolbar/toolbar.component.ts
```

---

## Adding a Downstream API

To proxy API requests to a backend service with automatic token relay:

1. Uncomment the `api` route in `application.yml` (or the profile-specific file):

   ```yaml
   spring:
     cloud:
       gateway:
         routes:
           - id: api
             uri: http://your-api-service:8081
             predicates:
               - Path=/api/**
             filters:
               - TokenRelay=
               - StripPrefix=1
   ```

2. The `TokenRelay` filter extracts the access token from the user's session and adds it as a `Bearer` token on the proxied request.

3. Your downstream API should validate the token against Keycloak's JWKS endpoint.

---

## Key Design Decisions

### CSRF Protection
- The BFF sets a `XSRF-TOKEN` cookie (not HTTP-only) on every response.
- Angular's `HttpClient` automatically reads this cookie and sends it as the `X-XSRF-TOKEN` header.
- BREACH/XOR encoding is disabled (`ServerCsrfTokenRequestAttributeHandler`) for compatibility with Angular's built-in handling.

### Session Management
- Sessions are stored in Redis, allowing horizontal scaling of the BFF.
- The browser receives only an opaque session cookie — no tokens.

### Keycloak Container Networking
- The `compose` profile uses explicit OIDC endpoint URIs to handle the dual-hostname problem:
  - **Browser-facing** URIs use `localhost:9090`
  - **Server-to-server** URIs use the compose service name `keycloak:9090`

### Logout
- Logout is RP-Initiated: the BFF invalidates the session, then redirects the browser to Keycloak's `end_session_endpoint`.
- The Angular app submits a form POST to `/bff/logout` (including the CSRF token).
