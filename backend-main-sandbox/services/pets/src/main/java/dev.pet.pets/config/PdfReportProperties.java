package dev.pet.pets.config;

import jakarta.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.pdf")
public class PdfReportProperties {
    private String fontPath = "/usr/share/fonts/truetype/inter-vf/InterVariable.ttf";
    private int maxRecords = 500;
    private int maxImageBytes = 5 * 1024 * 1024;
    private int maxImageDimension = 1600;
    private int maxOutputBytes = 15 * 1024 * 1024;
    private int maxRenderSeconds = 15;

    @PostConstruct
    void validate() {
        if (fontPath == null || fontPath.isBlank() || !Files.isRegularFile(Path.of(fontPath))) {
            throw new IllegalStateException("Configured PDF font is unavailable: " + fontPath);
        }
        if (maxRecords < 1 || maxImageBytes < 1024 || maxImageDimension < 64
            || maxOutputBytes < 1024 || maxRenderSeconds < 1) {
            throw new IllegalStateException("PDF report bounds must be positive");
        }
    }

    public String getFontPath() { return fontPath; }
    public void setFontPath(String fontPath) { this.fontPath = fontPath; }
    public int getMaxRecords() { return maxRecords; }
    public void setMaxRecords(int maxRecords) { this.maxRecords = maxRecords; }
    public int getMaxImageBytes() { return maxImageBytes; }
    public void setMaxImageBytes(int maxImageBytes) { this.maxImageBytes = maxImageBytes; }
    public int getMaxImageDimension() { return maxImageDimension; }
    public void setMaxImageDimension(int maxImageDimension) { this.maxImageDimension = maxImageDimension; }
    public int getMaxOutputBytes() { return maxOutputBytes; }
    public void setMaxOutputBytes(int maxOutputBytes) { this.maxOutputBytes = maxOutputBytes; }
    public int getMaxRenderSeconds() { return maxRenderSeconds; }
    public void setMaxRenderSeconds(int maxRenderSeconds) { this.maxRenderSeconds = maxRenderSeconds; }
}
