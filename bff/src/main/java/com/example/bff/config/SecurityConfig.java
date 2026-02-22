package com.example.bff.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.oidc.web.server.logout.OidcClientInitiatedServerLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.RedirectServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;
import org.springframework.security.web.server.csrf.CookieServerCsrfTokenRepository;
import org.springframework.security.web.server.csrf.CsrfToken;
import org.springframework.security.web.server.csrf.ServerCsrfTokenRequestAttributeHandler;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(
            ServerHttpSecurity http,
            ReactiveClientRegistrationRepository clientRegistrationRepository) {

        http
            .authorizeExchange(exchanges -> exchanges
                // Public BFF endpoints
                .pathMatchers("/bff/userinfo").permitAll()
                // Actuator health
                .pathMatchers("/actuator/health/**").permitAll()
                // API routes require authentication
                .pathMatchers("/api/**").authenticated()
                // Everything else (frontend assets) is public
                .anyExchange().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .authenticationSuccessHandler(
                    new RedirectServerAuthenticationSuccessHandler("/"))
            )
            .logout(logout -> logout
                .logoutUrl("/bff/logout")
                .logoutSuccessHandler(oidcLogoutSuccessHandler(clientRegistrationRepository))
            )
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieServerCsrfTokenRepository.withHttpOnlyFalse())
                // Disable BREACH/XOR encoding so Angular's built-in XSRF handling works
                .csrfTokenRequestHandler(new ServerCsrfTokenRequestAttributeHandler())
            );

        return http.build();
    }

    /**
     * OIDC RP-Initiated Logout: redirects the user to Keycloak's end_session_endpoint
     * and then back to the application after the session is terminated.
     */
    private ServerLogoutSuccessHandler oidcLogoutSuccessHandler(
            ReactiveClientRegistrationRepository clientRegistrationRepository) {
        var handler = new OidcClientInitiatedServerLogoutSuccessHandler(clientRegistrationRepository);
        handler.setPostLogoutRedirectUri("{baseUrl}");
        return handler;
    }

    /**
     * Ensures the CSRF cookie is written on every response.
     * Required because Spring Security 6 defers CSRF token generation;
     * without this filter the cookie may never be set for the SPA.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public WebFilter csrfCookieWebFilter() {
        return (exchange, chain) -> {
            Mono<CsrfToken> csrfToken = exchange.getAttributeOrDefault(
                    CsrfToken.class.getName(), Mono.empty());
            return csrfToken
                    .doOnSuccess(token -> { /* force subscription to write cookie */ })
                    .then(chain.filter(exchange));
        };
    }
}
