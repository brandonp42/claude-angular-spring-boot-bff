package com.example.bff.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
     * Required because Spring Security 6 defers CSRF token generation lazily;
     * the CsrfToken Mono is not subscribed to (and the cookie not written) unless
     * something explicitly forces it. Using beforeCommit ensures we read the attribute
     * AFTER the security filter chain has populated it, and force-subscribe just
     * before the response headers are sent.
     */
    @Bean
    public WebFilter csrfCookieWebFilter() {
        return (exchange, chain) -> {
            exchange.getResponse().beforeCommit(() -> Mono.defer(() -> {
                Mono<CsrfToken> csrfToken = exchange.getAttribute(CsrfToken.class.getName());
                return csrfToken != null ? csrfToken.then() : Mono.empty();
            }));
            return chain.filter(exchange);
        };
    }
}
