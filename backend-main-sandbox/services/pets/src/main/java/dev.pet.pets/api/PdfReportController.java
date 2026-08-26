package dev.pet.pets.api;

import dev.pet.pets.service.GeneratedPdf;
import dev.pet.pets.service.PdfReportService;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PdfReportController {
    private final PdfReportService reportService;

    public PdfReportController(PdfReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/pets/{id}/export.pdf")
    public ResponseEntity<byte[]> pet(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID id,
        @RequestParam(defaultValue = "ru") String locale
    ) {
        return response(reportService.pet(jwt, id, locale));
    }

    @GetMapping("/recipes/{id}/export.pdf")
    public ResponseEntity<byte[]> recipe(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable long id,
        @RequestParam(defaultValue = "ru") String locale
    ) {
        return response(reportService.recipe(jwt, id, locale));
    }

    private ResponseEntity<byte[]> response(GeneratedPdf pdf) {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .cacheControl(CacheControl.noStore())
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(pdf.filename(), StandardCharsets.UTF_8).build().toString()
            )
            .body(pdf.bytes());
    }
}
