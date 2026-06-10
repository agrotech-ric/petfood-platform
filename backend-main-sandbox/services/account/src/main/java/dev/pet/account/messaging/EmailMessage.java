package dev.pet.account.messaging;

import java.util.Map;

public record EmailMessage(
    String to,
    String subject,
    String template,
    Map<String, Object> vars
) {}
