package dev.pet.gateway.security;

import java.util.Set;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class PublicShareHeadersFilter implements GlobalFilter, Ordered {
    private static final Set<String> PUBLIC_PATHS = Set.of(
        "/api/v1/public/shares/pet",
        "/api/v1/public/shares/recipe",
        "/api/v1/public/shares/pet/photo",
        "/api/v1/public/shares/recipe/pet-photo"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String normalized = path.startsWith("/petfood/") ? path.substring("/petfood".length()) : path;
        if (exchange.getRequest().getMethod() == HttpMethod.GET && PUBLIC_PATHS.contains(normalized)) {
            exchange.getResponse().getHeaders().setCacheControl(CacheControl.noStore());
            exchange.getResponse().getHeaders().set("Referrer-Policy", "no-referrer");
            exchange.getResponse().getHeaders().set("X-Robots-Tag", "noindex, nofollow");
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -200;
    }
}
