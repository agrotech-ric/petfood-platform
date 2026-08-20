package dev.pet.notifications.consumer;

import dev.pet.notifications.services.SmtpMailSender;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class MailConsumersSecurityTest {
    @Test
    void verificationLogsExcludeOtpAndRecipient() throws Exception {
        String canaryOtp = "CANARY_OTP_938271";
        String canaryEmail = "canary-log@example.test";
        String json = """
            {"to":"%s","subject":"Confirmation","template":"confirm","vars":{"code":"%s"}}
            """.formatted(canaryEmail, canaryOtp);
        ByteArrayOutputStream captured = new ByteArrayOutputStream();
        PrintStream original = System.out;

        try {
            System.setOut(new PrintStream(captured, true, StandardCharsets.UTF_8));
            new MailConsumers(mock(SmtpMailSender.class)).onConfirm(json);
        } finally {
            System.setOut(original);
        }

        String logs = captured.toString(StandardCharsets.UTF_8);
        assertThat(logs).contains("Processing confirmation email");
        assertThat(logs).doesNotContain(canaryOtp, canaryEmail);
    }
}
