package dev.pet.notifications.services;

public final class HtmlEmailTemplate {
    private HtmlEmailTemplate() {}

    public static String wrap(String title, String bodyHtml) {
        return """
<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>%s</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <div style="max-width:640px;margin:0 auto;padding:28px 20px;">
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.25;font-weight:700;">
      %s
    </h1>

    <div style="font-size:14px;line-height:1.6;color:#111111;">
      %s
    </div>

    <div style="margin-top:24px;font-size:12px;line-height:1.6;color:#6b7280;">
    </div>
  </div>
</body>
</html>
""".formatted(
            escape(title),
            escape(title),
            bodyHtml
        );
    }

    public static String escape(String s) {
        if (s == null) return "";
        return s.replace("&","&amp;")
            .replace("<","&lt;")
            .replace(">","&gt;")
            .replace("\"","&quot;")
            .replace("'","&#39;");
    }

    public static String textToHtml(String text) {
        String e = escape(text);
        return e.replace("\n", "<br/>");
    }
}
