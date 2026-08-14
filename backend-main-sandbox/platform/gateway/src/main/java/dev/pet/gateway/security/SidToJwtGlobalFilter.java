package dev.pet.gateway.security;

import dev.pet.gateway.auth.AuthExchangeClient;
import dev.pet.gateway.auth.dto.SidExchangeResponse;
import dev.pet.gateway.config.AuthProps;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@Component
public class SidToJwtGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(SidToJwtGlobalFilter.class);

    private final AuthExchangeClient authClient;
    private final List<String> publicPaths;
    private final List<String> allowedOrigins;
    private final AntPathMatcher matcher = new AntPathMatcher();

    public SidToJwtGlobalFilter(AuthExchangeClient authClient, AuthProps props) {
        this.authClient = authClient;
        this.publicPaths = props.getSecurity().getPublicPaths();
        this.allowedOrigins = props.getSecurity().getAllowedOrigins();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        var req = exchange.getRequest();
        String path = req.getURI().getPath();

        if (path.startsWith("/.well-known/") || path.startsWith("/actuator")) {
            return chain.filter(exchange);
        }

        if (path.startsWith("/api/v1/auth/")) {
            return chain.filter(exchange);
        }

        if (req.getMethod() == HttpMethod.OPTIONS) {
            log.debug("[SidToJwt] Skip OPTIONS {}", path);
            return chain.filter(exchange);
        }

        if (isPublic(path)) {
            log.debug("[SidToJwt] Skip public {}", path);
            return chain.filter(exchange);
        }

        HttpCookie sidCookie = req.getCookies().getFirst("sid");
        if (sidCookie == null || sidCookie.getValue() == null || sidCookie.getValue().isBlank()) {
            log.debug("[SidToJwt] No SID cookie on {}", path);
            return rejectAuthentication(
                exchange,
                path,
                "{\"error\":\"unauthorized\",\"reason\":\"missing_sid_cookie\",\"message\":\"SID cookie is required\"}"
            );
        }

        String sid = sidCookie.getValue();
        log.debug("[SidToJwt] Session cookie detected on {}", path);

        return authClient.exchangeSid(sid)
            .map(Optional::of)
            .defaultIfEmpty(Optional.empty())
            .flatMap(result -> {
                if (result.isEmpty()) {
                    log.warn("[SidToJwt] Auth did not return token for SID on {}", path);
                    return rejectAuthentication(
                        exchange,
                        path,
                        "{\"error\":\"unauthorized\",\"reason\":\"sid_exchange_empty\",\"message\":\"Could not obtain token for this SID\"}"
                    );
                }

                String token = result.get().getToken();
                if (token == null || token.isBlank()) {
                    log.warn("[SidToJwt] Empty token from auth for {}", path);
                    return rejectAuthentication(
                        exchange,
                        path,
                        "{\"error\":\"unauthorized\",\"reason\":\"empty_token_from_auth\",\"message\":\"Auth service returned empty token\"}"
                    );
                }

                log.debug("[SidToJwt] Session credential attached for {}", path);
                return chain.filter(
                    exchange.mutate()
                        .request(r -> r.headers(h -> h.setBearerAuth(token)))
                        .build()
                );
            })
            .onErrorResume(ex -> {
                log.warn("[SidToJwt] Auth exchange failed for {}: {}", path, ex.toString());
                return rejectAuthentication(
                    exchange,
                    path,
                    "{\"error\":\"unauthorized\",\"reason\":\"auth_exchange_error\"}"
                );
            });
    }


    @Override
    public int getOrder() {
        return -100;
    }

    private boolean isPublic(String path) {
        if (publicPaths == null || publicPaths.isEmpty()) return false;
        String candidate = path.startsWith("/petfood/") ? path.substring("/petfood".length()) : path;
        for (String p : publicPaths) {
            if (matcher.match(p, candidate)) return true;
        }
        return false;
    }

    private Mono<Void> writeJson(ServerWebExchange ex, String json) {
        var resp = ex.getResponse();
        if (resp.isCommitted()) {
            return Mono.empty();
        }

        String origin = ex.getRequest().getHeaders().getOrigin();
        if (origin != null && propsAllowedOrigins().contains(origin)) {
            resp.getHeaders().set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
            resp.getHeaders().set(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
        }

        resp.getHeaders().set(HttpHeaders.CONTENT_TYPE, "application/json");
        var buf = resp
            .bufferFactory()
            .wrap(json.getBytes(StandardCharsets.UTF_8));

        return resp.writeWith(Mono.just(buf));
    }

    private List<String> propsAllowedOrigins() {
        return allowedOrigins;
    }

    private Mono<Void> rejectAuthentication(ServerWebExchange exchange, String path, String unauthorizedJson) {
        boolean photoPath = matcher.match("/api/v1/pets/photos/**", normalizedPath(path));
        if (!exchange.getResponse().isCommitted()) {
            exchange.getResponse().setStatusCode(photoPath ? HttpStatus.NOT_FOUND : HttpStatus.UNAUTHORIZED);
        }
        return writeJson(exchange, photoPath ? "{\"error\":\"not_found\"}" : unauthorizedJson);
    }

    private String normalizedPath(String path) {
        return path.startsWith("/petfood/") ? path.substring("/petfood".length()) : path;
    }
}
