package dev.pet.gateway.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient authWebClient(AuthProps props) {
        var a = props.getAuth();

        HttpClient http = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, a.getConnectTimeoutMs())
            .responseTimeout(Duration.ofMillis(a.getReadTimeoutMs()))
            .doOnConnected(conn -> conn
                .addHandlerLast(new ReadTimeoutHandler(a.getReadTimeoutMs(), TimeUnit.MILLISECONDS))
                .addHandlerLast(new WriteTimeoutHandler(a.getReadTimeoutMs(), TimeUnit.MILLISECONDS))
            );

        return WebClient.builder()
            .baseUrl(a.getBaseUrl())
            .clientConnector(new ReactorClientHttpConnector(http))
            .build();
    }
}
