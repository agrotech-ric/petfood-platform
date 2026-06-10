package dev.pet.notifications.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String EXCHANGE   = "mail.x";
    public static final String Q_CONFIRM  = "mail.q.confirm";
    public static final String Q_TWOFA    = "mail.q.twofa";
    public static final String RK_CONFIRM = "mail.confirm";
    public static final String RK_TWOFA   = "mail.twofa";

    public static final String Q_PASSWORD_RESET  = "mail.q.password-reset";
    public static final String RK_PASSWORD_RESET = "mail.password.reset";
    public static final String Q_PASSWORD  = "mail.q.password";
    public static final String RK_PASSWORD = "email.password";
    public static final String Q_RECOMMENDATION  = "mail.q.recommendation";
    public static final String RK_RECOMMENDATION = "mail.recommendation";

    @Bean
    Queue qRecommendation() {
        return QueueBuilder.durable(Q_RECOMMENDATION).build();
    }

    @Bean
    Binding bRecommendation() {
        return BindingBuilder.bind(qRecommendation()).to(mailExchange()).with(RK_RECOMMENDATION);
    }


    @Bean
    Queue qPassword() {
        return QueueBuilder.durable(Q_PASSWORD).build();
    }

    @Bean
    Binding bPassword() {
        return BindingBuilder.bind(qPassword()).to(mailExchange()).with(RK_PASSWORD);
    }
    @Bean TopicExchange mailExchange() { return new TopicExchange(EXCHANGE, true, false); }
    @Bean Queue qConfirm() { return QueueBuilder.durable(Q_CONFIRM).build(); }
    @Bean Queue qTwofa()   { return QueueBuilder.durable(Q_TWOFA).build(); }
    @Bean
    Queue qPasswordReset() {
        return QueueBuilder.durable(Q_PASSWORD_RESET).build();
    }

    @Bean Binding bConfirm() { return BindingBuilder.bind(qConfirm()).to(mailExchange()).with(RK_CONFIRM); }
    @Bean Binding bTwofa()   { return BindingBuilder.bind(qTwofa()).to(mailExchange()).with(RK_TWOFA); }

    @Bean
    Binding bPasswordReset() {
        return BindingBuilder.bind(qPasswordReset()).to(mailExchange()).with(RK_PASSWORD_RESET);
    }
}
