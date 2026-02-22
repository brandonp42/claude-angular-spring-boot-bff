package com.example.bff.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

/**
 * Exposes BFF-specific endpoints consumed by the Angular frontend.
 * These are handled directly by the Gateway's embedded web server,
 * NOT routed via Spring Cloud Gateway routes.
 */
@RestController
@RequestMapping("/bff")
public class BffController {

    /**
     * Returns the current user's profile information.
     * If the user is not authenticated, returns 200 with { "authenticated": false }.
     * The Angular app uses this to determine login state without triggering a redirect.
     */
    @GetMapping("/userinfo")
    public Mono<ResponseEntity<Map<String, Object>>> userinfo(
            @AuthenticationPrincipal OidcUser oidcUser) {

        Map<String, Object> body = new HashMap<>();

        if (oidcUser == null) {
            body.put("authenticated", false);
            return Mono.just(ResponseEntity.ok(body));
        }

        body.put("authenticated", true);
        body.put("username", oidcUser.getPreferredUsername());
        body.put("name", oidcUser.getFullName());
        body.put("email", oidcUser.getEmail());
        body.put("roles", oidcUser.getAuthorities().stream()
                .map(Object::toString)
                .toList());

        return Mono.just(ResponseEntity.ok(body));
    }
}
