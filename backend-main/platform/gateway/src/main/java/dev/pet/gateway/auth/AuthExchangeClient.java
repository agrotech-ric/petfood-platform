package dev.pet.gateway.auth;

import dev.pet.gateway.auth.dto.SidExchangeRequest;
import dev.pet.gateway.auth.dto.SidExchangeResponse;
import dev.pet.gateway.config.AuthProps;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Component
public class AuthExchangeClient {

    private static final Logger log = LoggerFactory.getLogger(AuthExchangeClient.class);

    private final WebClient webClient;
    private final AuthProps props;

    public AuthExchangeClient(WebClient authWebClient, AuthProps props) {
        this.webClient = authWebClient;
        this.props = props;
    }

    public Mono<SidExchangeResponse> exchangeSid(String sid) {
        log.debug("Exchanging SID with Auth: {}", sid);
        return webClient.post()
            .uri(props.getAuth().getExchangePath())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new SidExchangeRequest(sid))
            .retrieve()
            .bodyToMono(SidExchangeResponse.class)
            .doOnNext(resp -> log.debug("Got JWT from Auth, len={}", resp.getToken() == null ? 0 : resp.getToken().length()))
            .onErrorResume(WebClientResponseException.class, ex -> {
                log.warn("Auth responded {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                return Mono.empty();
            })
            .onErrorResume(ex -> {
                log.warn("Auth exchange failed: {}", ex.toString());
                return Mono.empty();
            });
    }
}
