package dev.pet.account.config;

import dev.pet.account.security.JwtRolesConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.Customizer;

import java.util.List;

@EnableMethodSecurity(prePostEnabled = true, jsr250Enabled = true)
@Configuration
public class SecurityConfig {

    private static final String[] SWAGGER_WHITELIST = new String[] {
        "/v3/api-docs/**",
        "/swagger-ui/**",
        "/swagger-ui.html",
    };

    @Bean
    SecurityFilterChain security(HttpSecurity http) throws Exception {
        JwtAuthenticationConverter jwtAuthConverter = new JwtAuthenticationConverter();
        jwtAuthConverter.setJwtGrantedAuthoritiesConverter(new JwtRolesConverter());

        return http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(SWAGGER_WHITELIST).permitAll()
                .requestMatchers(
                    "/api/v1/account/register",
                    "/api/v1/account/register/confirm",
                    "/api/v1/account/login/email",
                    "/api/v1/account/login/email/confirm",
                    "/api/v1/account/login/phone",
                    "/api/v1/account/login/phone/confirm",
                    "/api/v1/account/_debug/**",
                    "/api/v1/account/password/reset/start",
                    "/api/v1/account/password/reset/confirm"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter)))
            .build();
    }


}
