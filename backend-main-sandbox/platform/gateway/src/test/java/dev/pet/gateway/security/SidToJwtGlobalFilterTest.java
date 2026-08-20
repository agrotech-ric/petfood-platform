package dev.pet.gateway.security;

import dev.pet.gateway.auth.AuthExchangeClient;
import dev.pet.gateway.auth.dto.SidExchangeResponse;
import dev.pet.gateway.config.AuthProps;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SidToJwtGlobalFilterTest {

    @Test
    void successfulExchangeDoesNotFallThroughToEmptyExchangeHandling() {
        AuthExchangeClient authClient = mock(AuthExchangeClient.class);
        SidExchangeResponse response = new SidExchangeResponse();
        response.setToken("session-jwt");
        when(authClient.exchangeSid("session-id")).thenReturn(Mono.just(response));

        AuthProps props = new AuthProps();
        props.getSecurity().setPublicPaths(List.of("/ping"));
        props.getSecurity().setAllowedOrigins(List.of("http://localhost:5174"));
        SidToJwtGlobalFilter filter = new SidToJwtGlobalFilter(authClient, props);
        MockServerWebExchange exchange = MockServerWebExchange.from(
            MockServerHttpRequest.get("http://localhost/api/v1/account/profile/me")
                .cookie(new org.springframework.http.HttpCookie("sid", "session-id"))
                .header(HttpHeaders.AUTHORIZATION, "Bearer caller-token")
                .build()
        );
        AtomicInteger calls = new AtomicInteger();
        AtomicReference<String> forwardedAuthorization = new AtomicReference<>();

        filter.filter(exchange, forwarded -> {
            calls.incrementAndGet();
            forwardedAuthorization.set(forwarded.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
            return Mono.empty();
        }).block();

        assertThat(calls).hasValue(1);
        assertThat(forwardedAuthorization).hasValue("Bearer session-jwt");
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void hidesPhotoExistenceWhenSessionCookieIsMissing() {
        AuthProps props = new AuthProps();
        props.getSecurity().setPublicPaths(List.of("/ping"));
        props.getSecurity().setAllowedOrigins(List.of("http://localhost:5174"));
        SidToJwtGlobalFilter filter = new SidToJwtGlobalFilter(mock(AuthExchangeClient.class), props);
        MockServerWebExchange exchange = MockServerWebExchange.from(
            MockServerHttpRequest.get("http://localhost/petfood/api/v1/pets/photos/download?objectKey=foreign")
                .header(HttpHeaders.ORIGIN, "http://localhost:5174")
                .build()
        );

        filter.filter(exchange, forwarded -> Mono.empty()).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.NOT_FOUND);
        assertThat(exchange.getResponse().getHeaders().getAccessControlAllowOrigin())
            .isEqualTo("http://localhost:5174");
    }
}
