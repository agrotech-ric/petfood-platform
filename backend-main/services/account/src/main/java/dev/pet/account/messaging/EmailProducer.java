package dev.pet.account.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import static dev.pet.account.config.RabbitConfig.*;

@Component
public class EmailProducer {

    private final RabbitTemplate rt;
    private final ObjectMapper om;

    public EmailProducer(RabbitTemplate rt, ObjectMapper om) {
        this.rt = rt;
        this.om = om;
    }

    public void sendConfirmCode(String email, String code) {
        var msg = new EmailMessage(
            email,
            "Подтвердите аккаунт",
            "Ваш код подтверждения: {{code}}",
            java.util.Map.of("code", code)
        );

        rt.convertAndSend(EXCHANGE, RK_CONFIRM, toJson(msg));
    }

    public void sendEmailChangeConfirm(String newEmail, String code) {
        var msg = new EmailMessage(
            newEmail,
            "Подтвердите новый Email",
            "Ваш код подтверждения: {{code}}",
            java.util.Map.of("code", code)
        );

        rt.convertAndSend(EXCHANGE, RK_CONFIRM, toJson(msg));
    }

    public void sendPasswordChanged(String to) {
        var msg = new EmailMessage(
            to,
            "Пароль изменён",
            "Ваш пароль изменён",
            java.util.Map.of()
        );

        rt.convertAndSend(EXCHANGE, RK_PASSWORD, toJson(msg));
    }

    public void sendTwofaCode(String email, String code) {
        var msg = new EmailMessage(
            email,
            "Код для двухфакторной аутентификации",
            "Код подтверждения: {{code}}",
            java.util.Map.of("code", code)
        );

        rt.convertAndSend(EXCHANGE, RK_TWOFA, toJson(msg));
    }
//
//    public void sendPhoneLoginCode(String phone, String code) {
//        var msg = new EmailMessage(
//            phone,
//            "Your login code",
//            "phone-login-code",
//            java.util.Map.of("code", code)
//        );
//
//        rt.convertAndSend(EXCHANGE, RK_PHONE_LOGIN, toJson(msg));
//    }

    private String toJson(Object o) {
        try {
            return om.writeValueAsString(o);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    public void sendPasswordResetCode(String email, String code) {
        var msg = new EmailMessage(
            email,
            "Код для восстановления пароля",
            "Ваш код для восстановления пароля: {{code}}",
            java.util.Map.of("code", code)
        );
        rt.convertAndSend(EXCHANGE, RK_PASSWORD_RESET, toJson(msg));
    }


}
