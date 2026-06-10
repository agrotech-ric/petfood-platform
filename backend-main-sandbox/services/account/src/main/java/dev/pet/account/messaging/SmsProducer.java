package dev.pet.account.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import static dev.pet.account.config.RabbitConfig.EXCHANGE;
import static dev.pet.account.config.RabbitConfig.RK_SMS_PASSWORD_RESET;

@Component
public class SmsProducer {

    private final RabbitTemplate rt;

    public SmsProducer(RabbitTemplate rt) {
        this.rt = rt;
    }

    public void sendPasswordResetCode(String phone, String code) {
        var payload = java.util.Map.of(
            "phone", phone,
            "code", code,
            "type", "password-reset"
        );
        rt.convertAndSend(EXCHANGE, RK_SMS_PASSWORD_RESET, dev.pet.account.util.Json.toJson(payload));
    }
}
