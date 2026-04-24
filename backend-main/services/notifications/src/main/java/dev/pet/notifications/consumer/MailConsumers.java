package dev.pet.notifications.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pet.notifications.services.GmailSmtpSender;
import dev.pet.notifications.services.HtmlEmailTemplate;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class MailConsumers {
    private final ObjectMapper om = new ObjectMapper();
    private final GmailSmtpSender mailer;

    public MailConsumers(GmailSmtpSender mailer) {
        this.mailer = mailer;
    }

    public record EmailMessage(String to, String subject, String template, java.util.Map<String, Object> vars) {}

    @RabbitListener(queues = "mail.q.confirm")
    public void onConfirm(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] CONFIRM → To:%s | Subject:%s | Code:%s%n",
            msg.to(), msg.subject(), msg.vars() == null ? null : msg.vars().get("code"));

        String html = HtmlEmailTemplate.wrap(
            msg.subject(),
            HtmlEmailTemplate.textToHtml(msg.template())
        );

        mailer.sendHtml(msg.to(), msg.subject(), html, msg.vars());
    }

    @RabbitListener(queues = "mail.q.twofa")
    public void onTwofa(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] 2FA    → To:%s | Subject:%s | Code:%s%n",
            msg.to(), msg.subject(), msg.vars() == null ? null : msg.vars().get("code"));

        String html = HtmlEmailTemplate.wrap(
            msg.subject(),
            HtmlEmailTemplate.textToHtml(msg.template())
        );

        mailer.sendHtml(msg.to(), msg.subject(), html, msg.vars());
    }

    @RabbitListener(queues = "mail.q.password-reset")
    public void onPasswordReset(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] RESET  → To:%s | Subject:%s | Code:%s%n",
            msg.to(), msg.subject(), msg.vars() == null ? null : msg.vars().get("code"));

        String html = HtmlEmailTemplate.wrap(
            msg.subject(),
            HtmlEmailTemplate.textToHtml(msg.template())
        );

        mailer.sendHtml(msg.to(), msg.subject(), html, msg.vars());
    }

    @RabbitListener(queues = "mail.q.password")
    public void onPasswordChanged(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] PWDCH  → To:%s | Subject:%s%n",
            msg.to(), msg.subject());

        String html = HtmlEmailTemplate.wrap(
            msg.subject(),
            HtmlEmailTemplate.textToHtml(msg.template())
        );

        mailer.sendHtml(msg.to(), msg.subject(), html, msg.vars());
    }

    @RabbitListener(queues = "mail.q.recommendation")
    public void onRecommendation(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] RECOMM → To:%s | Subject:%s%n",
            msg.to(), msg.subject());

        mailer.sendHtml(
            msg.to(),
            msg.subject(),
            msg.template(),
            msg.vars()
        );
    }
}
