package dev.pet.account.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String EXCHANGE = "mail.x";

    public static final String Q_CONFIRM   = "mail.q.confirm";
    public static final String Q_TWOFA     = "mail.q.twofa";
    public static final String Q_PASSWORD  = "mail.q.password";

    public static final String RK_CONFIRM   = "mail.confirm";
    public static final String RK_TWOFA     = "mail.twofa";
    public static final String RK_PASSWORD  = "email.password";

    public static final String Q_PHONE_LOGIN = "mail.q.phone-login";
    public static final String RK_PHONE_LOGIN = "mail.phone_login";

    @Bean
    TopicExchange mailExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    Queue qConfirm() {
        return QueueBuilder.durable(Q_CONFIRM).build();
    }

    @Bean
    Queue qTwofa() {
        return QueueBuilder.durable(Q_TWOFA).build();
    }

    @Bean
    Queue qPassword() {
        return QueueBuilder.durable(Q_PASSWORD).build();
    }

    // новенькая очередь для логина по телефону
    @Bean
    Queue qPhoneLogin() {
        return QueueBuilder.durable(Q_PHONE_LOGIN).build();
    }

    @Bean
    Binding bConfirm() {
        return BindingBuilder
            .bind(qConfirm())
            .to(mailExchange())
            .with(RK_CONFIRM);
    }

    @Bean
    Binding bTwofa() {
        return BindingBuilder
            .bind(qTwofa())
            .to(mailExchange())
            .with(RK_TWOFA);
    }

    @Bean
    public Binding bPassword(Queue qPassword, TopicExchange mailExchange) {
        return BindingBuilder
            .bind(qPassword)
            .to(mailExchange)
            .with(RK_PASSWORD);
    }

    @Bean
    public Binding bPhoneLogin(Queue qPhoneLogin, TopicExchange mailExchange) {
        return BindingBuilder
            .bind(qPhoneLogin)
            .to(mailExchange)
            .with(RK_PHONE_LOGIN);
    }

    public static final String Q_PASSWORD_RESET  = "mail.q.password-reset";
    public static final String RK_PASSWORD_RESET = "mail.password.reset";

    public static final String Q_SMS_PASSWORD_RESET  = "sms.q.password-reset";
    public static final String RK_SMS_PASSWORD_RESET = "sms.password.reset";

    @Bean Queue qSmsPasswordReset() {
        return QueueBuilder.durable(Q_SMS_PASSWORD_RESET).build();
    }
    @Bean
    public Binding bSmsPasswordReset(Queue qSmsPasswordReset, TopicExchange mailExchange) {
        return BindingBuilder.bind(qSmsPasswordReset).to(mailExchange).with(RK_SMS_PASSWORD_RESET);
    }

}
