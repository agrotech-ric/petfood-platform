package dev.pet.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

@Configuration
public class GatewaySecurityConfig {

    @Bean
    KeyResolver clientIpKeyResolver(AuthProps props) {
        return exchange -> Mono.justOrEmpty(exchange.getRequest().getRemoteAddress())
            .map(address -> address.getAddress().getHostAddress())
            .map(remote -> {
                if (!props.getSecurity().getTrustedProxies().contains(remote)) {
                    return remote;
                }
                String forwarded = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
                if (forwarded == null || forwarded.isBlank()) {
                    return remote;
                }
                return forwarded.split(",", 2)[0].trim();
            })
            .defaultIfEmpty("unknown");
    }

    @Bean
    CorsWebFilter corsWebFilter(AuthProps props) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(props.getSecurity().getAllowedOrigins());
        cors.addAllowedMethod("GET");
        cors.addAllowedMethod("POST");
        cors.addAllowedMethod("PUT");
        cors.addAllowedMethod("PATCH");
        cors.addAllowedMethod("DELETE");
        cors.addAllowedMethod("OPTIONS");
        cors.addAllowedHeader("Content-Type");
        cors.addAllowedHeader("Accept");
        cors.addAllowedHeader("X-Requested-With");
        cors.addAllowedHeader("Authorization");
        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return new CorsWebFilter(source);
    }
}
