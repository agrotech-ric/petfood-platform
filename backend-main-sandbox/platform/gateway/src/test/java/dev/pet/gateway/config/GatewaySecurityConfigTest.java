package dev.pet.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import java.net.InetSocketAddress;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

class GatewaySecurityConfigTest {
    @Test
    void appliesCredentialedCorsOnlyToExactAllowedOrigin() {
        AuthProps props = new AuthProps();
        props.getSecurity().setAllowedOrigins(List.of("http://10.1.10.144:5174"));
        var filter = new GatewaySecurityConfig().corsWebFilter(props);
        var allowedRequest = MockServerHttpRequest.options("http://localhost/api/v1/account/login/email")
            .header("Origin", "http://10.1.10.144:5174")
            .header("Access-Control-Request-Method", "POST")
            .build();
        var allowedExchange = MockServerWebExchange.from(allowedRequest);
        AtomicBoolean forwarded = new AtomicBoolean();

        filter.filter(allowedExchange, exchange -> {
            forwarded.set(true);
            return exchange.getResponse().setComplete();
        }).block();

        assertThat(forwarded).isFalse();
        assertThat(allowedExchange.getResponse().getHeaders().getAccessControlAllowOrigin())
            .isEqualTo("http://10.1.10.144:5174");

        var rejectedExchange = MockServerWebExchange.from(
            MockServerHttpRequest.options("http://localhost/api/v1/account/login/email")
                .header("Origin", "https://evil.example")
                .header("Access-Control-Request-Method", "POST")
                .build()
        );
        filter.filter(rejectedExchange, exchange -> exchange.getResponse().setComplete()).block();

        assertThat(rejectedExchange.getResponse().getHeaders().getAccessControlAllowOrigin()).isNull();
    }

    @Test
    void ignoresForwardedAddressFromUntrustedPeer() {
        AuthProps props = new AuthProps();
        props.getSecurity().setTrustedProxies(List.of("10.0.0.10"));
        KeyResolver resolver = new GatewaySecurityConfig().clientIpKeyResolver(props);
        var request = MockServerHttpRequest.get("/")
            .remoteAddress(new InetSocketAddress("192.0.2.5", 1234))
            .header("X-Forwarded-For", "198.51.100.9")
            .build();

        assertThat(resolver.resolve(MockServerWebExchange.from(request)).block()).isEqualTo("192.0.2.5");
    }

    @Test
    void acceptsFirstForwardedAddressFromTrustedPeer() {
        AuthProps props = new AuthProps();
        props.getSecurity().setTrustedProxies(List.of("10.0.0.10"));
        KeyResolver resolver = new GatewaySecurityConfig().clientIpKeyResolver(props);
        var request = MockServerHttpRequest.get("/")
            .remoteAddress(new InetSocketAddress("10.0.0.10", 1234))
            .header("X-Forwarded-For", "198.51.100.9, 10.0.0.10")
            .build();

        assertThat(resolver.resolve(MockServerWebExchange.from(request)).block()).isEqualTo("198.51.100.9");
    }
}
