package dev.pet.gateway.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

class PublicShareHeadersFilterTest {
    @Test
    void appliesPrivacyHeadersBeforeACommittedRateLimitResponse() {
        var exchange = MockServerWebExchange.from(
            MockServerHttpRequest.get("/petfood/api/v1/public/shares/recipe").build()
        );
        new PublicShareHeadersFilter().filter(exchange, current -> {
            current.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            return current.getResponse().setComplete();
        }).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(exchange.getResponse().getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(exchange.getResponse().getHeaders().getFirst("Referrer-Policy")).isEqualTo("no-referrer");
        assertThat(exchange.getResponse().getHeaders().getFirst("X-Robots-Tag")).isEqualTo("noindex, nofollow");
    }

    @Test
    void doesNotApplyHeadersToNearMissOrNonGetRoutes() {
        var filter = new PublicShareHeadersFilter();
        for (MockServerHttpRequest request : new MockServerHttpRequest[] {
            MockServerHttpRequest.get("/api/v1/public/shares/recipe/extra").build(),
            MockServerHttpRequest.post("/api/v1/public/shares/recipe").build()
        }) {
            var exchange = MockServerWebExchange.from(request);
            filter.filter(exchange, current -> current.getResponse().setComplete()).block();
            assertThat(exchange.getResponse().getHeaders().getFirst("X-Robots-Tag")).isNull();
        }
    }
}
