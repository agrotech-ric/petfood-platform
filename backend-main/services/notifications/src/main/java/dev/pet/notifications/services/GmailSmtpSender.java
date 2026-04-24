package dev.pet.notifications.services;

import dev.pet.notifications.config.SmtpProps;
import jakarta.annotation.PostConstruct;
import jakarta.mail.*;
import jakarta.mail.internet.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Properties;

@Service
public class GmailSmtpSender {

    private final SmtpProps props;
    private Session session;

    public GmailSmtpSender(SmtpProps props) {
        this.props = props;
    }

    @PostConstruct
    public void init() {
        Properties p = new Properties();
        p.put("mail.smtp.auth", "true");
        p.put("mail.smtp.starttls.enable", "true");
        p.put("mail.smtp.host", "smtp.gmail.com");
        p.put("mail.smtp.port", "587");

        this.session = Session.getInstance(
            p,
            new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(
                        props.getUser(),
                        props.getPass()
                    );
                }
            }
        );
    }

    public void sendPlainText(String to, String subject, String body, Map<String, Object> vars) {
        String resolvedBody = applyVars(body, vars);

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(props.getFrom()));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
            message.setSubject(subject, "UTF-8");
            message.setText(resolvedBody, "UTF-8");

            Transport.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("SMTP send error", e);
        }
    }

    private String applyVars(String template, Map<String, Object> vars) {
        String r = template;
        for (var e : vars.entrySet()) {
            r = r.replace("{{" + e.getKey() + "}}", String.valueOf(e.getValue()));
        }
        return r;
    }

    public void sendHtml(String to, String subject, String html, Map<String, Object> vars) {
        String resolved = applyVars(html, vars);

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(props.getFrom()));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
            message.setSubject(subject, "UTF-8");
            message.setContent(resolved, "text/html; charset=UTF-8");

            Transport.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("SMTP send error", e);
        }
    }

}
