package dev.pet.pets.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.openhtmltopdf.svgsupport.BatikSVGDrawer;
import dev.pet.pets.config.PdfReportProperties;
import dev.pet.pets.domain.Pet;
import dev.pet.pets.domain.PetContraindication;
import dev.pet.pets.domain.PetHealthRecord;
import dev.pet.pets.domain.Recipe;
import dev.pet.pets.error.BadRequestException;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.repo.PetContraindicationRepository;
import dev.pet.pets.repo.PetHealthRecordRepository;
import dev.pet.pets.repo.PetRepository;
import dev.pet.pets.repo.RecipeRepository;
import jakarta.annotation.PreDestroy;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.ByteArrayInputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PdfReportService {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final String PLATFORM_URL = "https://agrotech.astanait.edu.kz/petfood";

    private final PetRepository petRepository;
    private final RecipeRepository recipeRepository;
    private final PetHealthRecordRepository healthRepository;
    private final PetContraindicationRepository contraindicationRepository;
    private final PetPhotoStorage photoStorage;
    private final ResourceShareService shareService;
    private final ObjectMapper objectMapper;
    private final PdfReportProperties properties;
    private final ExecutorService renderer = new ThreadPoolExecutor(
        2, 2, 0L, TimeUnit.MILLISECONDS, new ArrayBlockingQueue<>(4), runnable -> {
            Thread thread = new Thread(runnable, "petfood-pdf-renderer");
            thread.setDaemon(true);
            return thread;
        }, new ThreadPoolExecutor.AbortPolicy()
    );

    public PdfReportService(
        PetRepository petRepository,
        RecipeRepository recipeRepository,
        PetHealthRecordRepository healthRepository,
        PetContraindicationRepository contraindicationRepository,
        PetPhotoStorage photoStorage,
        ResourceShareService shareService,
        ObjectMapper objectMapper,
        PdfReportProperties properties
    ) {
        this.petRepository = petRepository;
        this.recipeRepository = recipeRepository;
        this.healthRepository = healthRepository;
        this.contraindicationRepository = contraindicationRepository;
        this.photoStorage = photoStorage;
        this.shareService = shareService;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public GeneratedPdf pet(Jwt jwt, UUID petId, String localeValue) {
        UUID ownerId = subject(jwt);
        Pet pet = petRepository.findById(petId).filter(item -> ownerId.equals(item.getOwnerId()))
            .orElseThrow(() -> new NotFoundException("Pet not found"));
        ReportMessages messages = ReportMessages.forLocale(localeValue);
        List<PetHealthRecord> records = new ArrayList<>(
            healthRepository.findByPetIdAndOwnerIdWithSymptoms(petId, ownerId)
        );
        records.sort(Comparator.comparing(PetHealthRecord::getRecordDate, Comparator.nullsLast(Comparator.naturalOrder())));
        List<Recipe> recipes = recipeRepository
            .findByPet_IdAndOwnerIdAndStatusOrderByUpdatedAtDesc(petId, ownerId, "calculated")
            .stream().filter(shareService::isCalculated).toList();
        enforceRecordLimit(records.size() + recipes.size());
        String html = petHtml(pet, records, contraindicationRepository.findByPetId(petId).orElse(null), recipes, messages);
        return new GeneratedPdf(render(html), filename(messages, "pet", pet.getName()));
    }

    @Transactional(readOnly = true)
    public GeneratedPdf recipe(Jwt jwt, long recipeId, String localeValue) {
        UUID ownerId = subject(jwt);
        Recipe recipe = recipeRepository.findById(recipeId).filter(item -> ownerId.equals(item.getOwnerId()))
            .orElseThrow(() -> new NotFoundException("Recipe not found"));
        if (!shareService.isCalculated(recipe)) {
            throw new BadRequestException("Only a fully calculated recipe can be exported");
        }
        enforceRecordLimit(recipe.getIngredients().size() + recipe.getNutrientConstraints().size());
        ReportMessages messages = ReportMessages.forLocale(localeValue);
        return new GeneratedPdf(render(recipeHtml(recipe, messages)), filename(messages, "recipe", recipe.getName()));
    }

    private String petHtml(
        Pet pet,
        List<PetHealthRecord> records,
        PetContraindication contraindication,
        List<Recipe> recipes,
        ReportMessages m
    ) {
        StringBuilder body = new StringBuilder();
        hero(body, m.get("petTitle"), pet.getName(), imageData(pet));
        section(body, m.get("profile"));
        body.append("<table class='facts'>")
            .append(row(m.get("name"), pet.getName()))
            .append(row(m.get("species"), pet.getSpecies() == null ? null : pet.getSpecies().getName()))
            .append(row(m.get("breed"), pet.getBreed() == null ? null : pet.getBreed().getName()))
            .append(row(m.get("gender"), pet.getGender()))
            .append(row(m.get("color"), pet.getColor() == null ? null : pet.getColor().getName()))
            .append(row(m.get("birthDate"), pet.getBirthDate()))
            .append(row(m.get("weight"), pet.getWeightKg() == null ? null : pet.getWeightKg() + " kg"))
            .append(row(m.get("passport"), pet.getPassportId()))
            .append(row(m.get("reproductive"), pet.getReproductiveStatus() == null ? null : pet.getReproductiveStatus().getName()))
            .append(row(m.get("reproductiveDetail"), pet.getReproductiveSubStatus() == null ? null : pet.getReproductiveSubStatus().getName()))
            .append(row(m.get("puppies"), pet.getPuppiesCount()))
            .append(row(m.get("comments"), pet.getComments()))
            .append("</table>");

        section(body, m.get("health"));
        if (records.isEmpty()) body.append(empty(m));
        else {
            body.append("<table><thead><tr>").append(th(m.get("date"))).append(th(m.get("condition")))
                .append(th(m.get("activity"))).append(th(m.get("weight"))).append(th(m.get("symptoms")))
                .append(th(m.get("notes"))).append("</tr></thead><tbody>");
            for (PetHealthRecord record : records) {
                body.append("<tr>").append(td(record.getRecordDate())).append(td(join(record.getConditionName(), record.getConditionStatus())))
                    .append(td(record.getActivityType() == null ? null : record.getActivityType().getName()))
                    .append(td(record.getWeightKg())).append(td(record.getSymptoms() == null ? null : record.getSymptoms().stream().map(item -> item.getName()).sorted().toList()))
                    .append(td(record.getNotes())).append("</tr>");
            }
            body.append("</tbody></table>");
            body.append("<div class='chart-grid'>").append(lineChart(records, true, m.get("weight")))
                .append(lineChart(records, false, m.get("activity"))).append("</div>");
        }

        section(body, m.get("contra"));
        if (contraindication == null) body.append(empty(m));
        else body.append("<p><strong>").append(escape(m.get("ingredients"))).append(":</strong> ")
            .append(escape(readContraindications(contraindication))).append("</p><p>")
            .append(escape(m.empty(contraindication.getDescription()))).append("</p>");

        section(body, m.get("recipes"));
        if (recipes.isEmpty()) body.append(empty(m));
        else {
            body.append("<table><thead><tr>").append(th(m.get("name"))).append(th(m.get("description")))
                .append(th(m.get("value"))).append(th(m.get("calculatedAt"))).append("</tr></thead><tbody>");
            for (Recipe recipe : recipes) {
                JsonNode calories = recipe.getCalculationResult().path("calories");
                body.append("<tr>").append(td(recipe.getName())).append(td(recipe.getDescription()))
                    .append(td(calories.isNumber() ? calories.asDouble() + " kcal" : null))
                    .append(td(recipe.getCalculatedAt())).append("</tr>");
            }
            body.append("</tbody></table>");
        }
        return document(m.get("petTitle"), body.toString(), m);
    }

    private String recipeHtml(Recipe recipe, ReportMessages m) {
        StringBuilder body = new StringBuilder();
        Pet pet = recipe.getPet();
        hero(body, m.get("recipeTitle"), recipe.getName(), pet == null ? null : imageData(pet));
        if (pet != null) {
            section(body, m.get("pet"));
            body.append("<table class='facts'>").append(row(m.get("name"), pet.getName()))
                .append(row(m.get("species"), pet.getSpecies() == null ? null : pet.getSpecies().getName()))
                .append(row(m.get("breed"), pet.getBreed() == null ? null : pet.getBreed().getName()))
                .append(row(m.get("birthDate"), pet.getBirthDate()))
                .append(row(m.get("weight"), pet.getWeightKg() == null ? null : pet.getWeightKg() + " kg"))
                .append("</table>");
        }
        section(body, m.get("profile"));
        body.append("<table class='facts'>").append(row(m.get("name"), recipe.getName()))
            .append(row(m.get("description"), recipe.getDescription()))
            .append(row(m.get("category"), join(recipe.getAgeCategory(), recipe.getBreedSize())))
            .append(row(m.get("weight"), recipe.getTargetWeightKg()))
            .append(row(m.get("ageMonths"), recipe.getTargetAgeMonths()))
            .append(row(m.get("gender"), recipe.getTargetGender()))
            .append(row(m.get("breed"), recipe.getTargetBreed() == null ? null : recipe.getTargetBreed().getName()))
            .append(row(m.get("activity"), recipe.getTargetActivityType() == null ? null : recipe.getTargetActivityType().getName()))
            .append(row(m.get("reproductive"), recipe.getTargetReproductiveStatus() == null ? null : recipe.getTargetReproductiveStatus().getName()))
            .append(row(m.get("condition"), join(recipe.getTargetDisorder(), recipe.getTargetHealthCondition() == null ? null : recipe.getTargetHealthCondition().getNameRu())))
            .append(row(m.get("symptoms"), recipe.getTargetSymptoms().stream().map(item -> item.getName()).toList()))
            .append(row(m.get("energy"), recipe.getTargetEnergyKcal()))
            .append(row(m.get("maximize"), recipe.getMaximizeNutrients()))
            .append(row(m.get("version"), recipe.getCalculationVersion()))
            .append(row(m.get("calculatedAt"), recipe.getCalculatedAt()))
            .append("</table>");

        section(body, m.get("ingredients"));
        body.append("<table><thead><tr>").append(th(m.get("name"))).append(th(m.get("category")))
            .append(th(m.get("minimum"))).append(th(m.get("maximum"))).append(th(m.get("quantity")))
            .append("</tr></thead><tbody>");
        recipe.getIngredients().forEach(item -> body.append("<tr>")
            .append(td(join(item.getIngredient().getName(), item.getIngredient().getSubtype())))
            .append(td(item.getIngredient().getCategory())).append(td(item.getMinPercent() + "%"))
            .append(td(item.getMaxPercent() + "%")).append(td(join(item.getResultPercent(), item.getResultGrams()))).append("</tr>"));
        body.append("</tbody></table>");

        section(body, m.get("constraints"));
        if (recipe.getNutrientConstraints().isEmpty()) body.append(empty(m));
        else {
            body.append("<table><thead><tr>").append(th(m.get("name"))).append(th(m.get("minimum")))
                .append(th(m.get("maximum"))).append("</tr></thead><tbody>");
            recipe.getNutrientConstraints().forEach(item -> body.append("<tr>").append(td(item.getNutrientKey()))
                .append(td(item.getMinValue())).append(td(item.getMaxValue())).append("</tr>"));
            body.append("</tbody></table>");
        }

        section(body, m.get("charts"));
        JsonNode result = recipe.getCalculationResult();
        body.append(metricCards(result, m));
        boolean chartAdded = false;
        JsonNode composition = result.path("composition");
        JsonNode nutrition = result.path("nutrition");
        JsonNode nutrients = result.path("nutrients");
        JsonNode minerals = result.path("minerals");
        JsonNode vitamins = result.path("vitamins");
        if (composition.isArray() && !composition.isEmpty()) {
            body.append(donutChart(m.get("composition"), composition, "percent", "%"));
            chartAdded = true;
        }
        if (nutrition.isArray() && !nutrition.isEmpty()) {
            body.append(donutChart(m.get("nutrition"), nutrition, "value", ""));
            chartAdded = true;
        }
        if (nutrients.isArray() && !nutrients.isEmpty()) {
            body.append(valueTable(m.get("nutrients"), nutrients));
            chartAdded = true;
        }
        if (minerals.isArray() && !minerals.isEmpty()) {
            body.append(balanceChart(m.get("minerals"), minerals, m));
            chartAdded = true;
        }
        if (vitamins.isArray() && !vitamins.isEmpty()) {
            body.append(balanceChart(m.get("vitamins"), vitamins, m));
            chartAdded = true;
        }
        JsonNode digestion = recipe.getCalculationResult().path("digestion");
        if (digestion.isObject()) {
            for (String key : List.of("protein", "fat", "carbs")) {
                JsonNode items = digestion.path(key);
                if (items.isArray() && !items.isEmpty()) {
                    body.append(digestionChart(m.get(key), items, m));
                    chartAdded = true;
                }
            }
        }
        if (!chartAdded) body.append(empty(m));

        section(body, m.get("calculation"));
        body.append(calculationTable(recipe.getCalculationResult(), m));
        return document(m.get("recipeTitle"), body.toString(), m);
    }

    private byte[] render(String html) {
        var future = renderer.submit(() -> {
            try (ByteArrayOutputStream output = new ByteArrayOutputStream(); BatikSVGDrawer svg = new BatikSVGDrawer()) {
                PdfRendererBuilder builder = new PdfRendererBuilder();
                builder.useFont(new File(properties.getFontPath()), "Inter");
                builder.useSVGDrawer(svg);
                builder.withHtmlContent(html, null);
                builder.toStream(output);
                builder.run();
                byte[] bytes = output.toByteArray();
                if (bytes.length > properties.getMaxOutputBytes()) {
                    throw new BadRequestException("Generated PDF exceeds the configured size limit");
                }
                return bytes;
            }
        });
        try {
            return future.get(properties.getMaxRenderSeconds(), TimeUnit.SECONDS);
        } catch (Exception ex) {
            future.cancel(true);
            if (ex.getCause() instanceof RuntimeException runtime) throw runtime;
            throw new IllegalStateException("PDF generation failed", ex);
        }
    }

    private String imageData(Pet pet) {
        if (pet.getPhotoObjectKey() == null || pet.getPhotoObjectKey().isBlank()) return null;
        try {
            StoredPhoto stored = photoStorage.read(pet.getPhotoObjectKey());
            if (stored.bytes().length > properties.getMaxImageBytes()) return null;
            BufferedImage source;
            try (var imageInput = ImageIO.createImageInputStream(new ByteArrayInputStream(stored.bytes()))) {
                if (imageInput == null) return null;
                var readers = ImageIO.getImageReaders(imageInput);
                if (!readers.hasNext()) return null;
                var reader = readers.next();
                try {
                    reader.setInput(imageInput, true, true);
                    int originalWidth = reader.getWidth(0);
                    int originalHeight = reader.getHeight(0);
                    int maxSourceDimension = properties.getMaxImageDimension() * 16;
                    if (originalWidth < 1 || originalHeight < 1
                        || originalWidth > maxSourceDimension || originalHeight > maxSourceDimension) return null;
                    int subsampling = Math.max(1, (int) Math.ceil(
                        (double) Math.max(originalWidth, originalHeight) / properties.getMaxImageDimension()
                    ));
                    var readParameters = reader.getDefaultReadParam();
                    readParameters.setSourceSubsampling(subsampling, subsampling, 0, 0);
                    source = reader.read(0, readParameters);
                } finally {
                    reader.dispose();
                }
            }
            if (source == null) return null;
            BufferedImage normalized = coverSquare(source, properties.getMaxImageDimension());
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(normalized, "jpg", output);
            return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception ex) {
            return null;
        }
    }

    private String document(String title, String body, ReportMessages m) {
        return """
            <!DOCTYPE html><html lang='%s'><head><meta charset='UTF-8'/><style>
            @page { size: A4; margin: 15mm 13mm 17mm; @bottom-center { content: counter(page) ' / ' counter(pages); font-family: 'Inter'; font-size: 7.5pt; color: #858585; } }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: 'Inter'; color: #242424; font-size: 9pt; line-height: 1.45; }
            h1 { margin: 0 0 4px; color: #242424; font-size: 22pt; font-weight: bold; }
            h2 { margin: 18px 0 8px; padding: 9px 12px; border: 1px solid #dddddd; border-radius: 6px; background: #ffffff; color: #f28c4c; font-size: 13pt; font-weight: bold; page-break-after: avoid; }
            p { margin: 6px 0; }
            .hero { min-height: 100px; padding: 14px 16px; border: 1px solid #dddddd; border-radius: 8px; background: #ffffff; page-break-inside: avoid; }
            .hero-table { width: 100%%; margin: 0; }
            .hero-table td { padding: 0; border: 0; vertical-align: middle; }
            .hero-photo-cell { width: 108px; padding-right: 16px !important; }
            .hero img { width: 96px; height: 96px; border-radius: 8px; }
            .subtitle { color: #858585; font-size: 11pt; }
            .platform-link { margin-top: 18px; color: #858585; font-size: 7.5pt; text-align: center; }
            .platform-link a { color: #858585; text-decoration: none; }
            table { width: 100%%; margin: 5px 0 12px; border-collapse: collapse; page-break-inside: auto; }
            tr { page-break-inside: avoid; }
            th, td { padding: 6px 7px; border-bottom: 1px solid #dddddd; vertical-align: top; text-align: left; }
            th { color: #242424; font-size: 8.5pt; font-weight: bold; }
            td { color: #666666; }
            .facts { border: 1px solid #dddddd; border-radius: 6px; }
            .facts td:first-child { width: 32%%; color: #242424; font-weight: bold; }
            .empty { color: #858585; font-style: italic; }
            .metrics { width: 100%%; margin: 8px 0 12px; border-spacing: 8px 0; border-collapse: separate; table-layout: fixed; }
            .metrics td { padding: 12px 6px; border: 1px solid #dddddd; border-radius: 6px; text-align: center; }
            .metric-value { color: #f28c4c; font-size: 17pt; font-weight: bold; }
            .metric-label { color: #858585; font-size: 7.5pt; }
            .chart-grid { width: 100%%; }
            .chart { margin: 10px 0 14px; padding: 12px; border: 1px solid #dddddd; border-radius: 6px; page-break-inside: avoid; }
            .chart-title { margin-bottom: 5px; color: #f28c4c; font-size: 11pt; font-weight: bold; }
            .donut-layout { width: 100%%; margin: 0; table-layout: fixed; }
            .donut-layout td { border: 0; vertical-align: middle; }
            .donut-cell { width: 48%%; }
            .legend-row td { padding: 4px 3px; border-bottom: 1px solid #eeeeee; }
            .legend-dot { display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 50%%; }
            .value-grid { width: 100%%; table-layout: fixed; }
            .value-grid td:nth-child(even) { text-align: right; }
            .balance-row { width: 100%%; margin: 3px 0; table-layout: fixed; }
            .balance-row td { padding: 2px 4px; border: 0; }
            .balance-label { width: 28%%; color: #242424; font-size: 7.5pt; text-align: right; }
            .balance-value { width: 12%%; color: #666666; font-size: 7.5pt; }
            .balance-track { height: 11px; border-left: 1px solid #b4b4b4; background: #f0f1f3; }
            .balance-fill { height: 11px; border-radius: 0 6px 6px 0; }
            .balance-norm { margin: 3px 12%% 0 28%%; border-top: 1px solid #b4b4b4; color: #858585; font-size: 7pt; text-align: center; }
            .appendix { font-size: 7.5pt; }
            .appendix th { background: #fff1e6; color: #242424; }
            .appendix td:first-child { width: 52%%; color: #242424; font-weight: bold; overflow-wrap: break-word; }
            svg { width: 100%%; height: 190px; }
            </style><title>%s</title></head><body>%s<div class='platform-link'><a href='%s'>%s</a></div></body></html>
            """.formatted(escape(m.locale()), escape(title), body,
                escape(PLATFORM_URL), escape(PLATFORM_URL));
    }

    private void hero(StringBuilder body, String title, String subtitle, String image) {
        body.append("<div class='hero'><table class='hero-table'><tr>");
        if (image != null) body.append("<td class='hero-photo-cell'><img src='").append(image).append("' alt='' /></td>");
        body.append("<td><h1>").append(escape(title))
            .append("</h1><div class='subtitle'>").append(escape(subtitle)).append("</div></td></tr></table></div>");
    }

    static BufferedImage coverSquare(BufferedImage source, int maxDimension) {
        int cropSize = Math.min(source.getWidth(), source.getHeight());
        int sourceX = (source.getWidth() - cropSize) / 2;
        int sourceY = (source.getHeight() - cropSize) / 2;
        int targetSize = Math.min(cropSize, maxDimension);
        BufferedImage normalized = new BufferedImage(targetSize, targetSize, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = normalized.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, targetSize, targetSize);
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics.drawImage(source, 0, 0, targetSize, targetSize,
            sourceX, sourceY, sourceX + cropSize, sourceY + cropSize, null);
        graphics.dispose();
        return normalized;
    }

    private String lineChart(List<PetHealthRecord> records, boolean weight, String title) {
        List<PetHealthRecord> usable = records.stream().filter(item -> {
            Double value = weight ? item.getWeightKg() : item.getActivityHours();
            return value != null && Double.isFinite(value);
        }).toList();
        if (usable.isEmpty()) return "";
        List<Double> values = usable.stream().map(item -> weight ? item.getWeightKg() : item.getActivityHours()).toList();
        List<String> labels = usable.stream().map(item -> item.getRecordDate() == null ? "—" : item.getRecordDate().toString()).toList();
        return lineChartSvg(title, values, labels, "#4A90E2");
    }

    private String metricCards(JsonNode result, ReportMessages m) {
        return "<table class='metrics'><tr>" + metric(result.path("calories"), "kcal", m.get("energyValue"))
            + metric(result.path("dailyNorm"), "g", m.get("dailyPortion"))
            + metric(result.path("dailyCaloriesNorm"), "kcal", m.get("dailyCalories")) + "</tr></table>";
    }

    private String metric(JsonNode node, String unit, String label) {
        String value = node.isNumber() ? formatNumber(node.asDouble()) : "—";
        return "<td><div class='metric-value'>" + escape(value + " " + unit) + "</div><div class='metric-label'>" + escape(label) + "</div></td>";
    }

    private String donutChart(String title, JsonNode items, String valueField, String suffix) {
        String[] colors = {"#4A90E2", "#7FDB6A", "#FF9F5A", "#E74C3C", "#9B59B6"};
        int count = Math.min(items.size(), 12);
        double total = 0;
        for (int i = 0; i < count; i++) total += Math.max(0, items.get(i).path(valueField).asDouble());
        if (total <= 0) return "";
        StringBuilder svg = new StringBuilder("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 230'>");
        double angle = -90;
        for (int i = 0; i < count; i++) {
            double value = Math.max(0, items.get(i).path(valueField).asDouble());
            if (value <= 0) continue;
            double sweep = value / total * 360;
            if (sweep >= 359.999) {
                svg.append("<circle cx='160' cy='105' r='61' fill='none' stroke='").append(colors[i % colors.length])
                    .append("' stroke-width='34'/>");
            } else {
                svg.append("<path d='").append(donutPath(160, 105, 78, 44, angle, angle + sweep))
                    .append("' fill='").append(colors[i % colors.length]).append("' stroke='#ffffff' stroke-width='1'/>");
            }
            double middle = Math.toRadians(angle + sweep / 2);
            double labelRadius = 94;
            svg.append("<text x='").append(formatNumber(160 + Math.cos(middle) * labelRadius)).append("' y='")
                .append(formatNumber(108 + Math.sin(middle) * labelRadius)).append("' font-size='9' text-anchor='middle' fill='")
                .append(colors[i % colors.length]).append("'>").append(escape(formatNumber(value) + suffix)).append("</text>");
            angle += sweep;
        }
        svg.append("</svg>");
        StringBuilder legend = new StringBuilder("<table>");
        for (int i = 0; i < count; i++) {
            JsonNode item = items.get(i);
            double value = item.path(valueField).asDouble();
            String label = item.path("label").asText(item.path("key").asText("#" + (i + 1)));
            String unit = item.path("unit").asText("");
            legend.append("<tr class='legend-row'><td><span class='legend-dot' style='background:")
                .append(colors[i % colors.length]).append("'></span>").append(escape(label)).append("</td><td>")
                .append(escape(formatNumber(value) + suffix + (unit.isBlank() ? "" : " " + unit))).append("</td></tr>");
        }
        return "<div class='chart'><div class='chart-title'>" + escape(title) + "</div><table class='donut-layout'><tr><td class='donut-cell'>"
            + svg + "</td><td>" + legend.append("</table>") + "</td></tr></table></div>";
    }

    private String donutPath(double cx, double cy, double outer, double inner, double startAngle, double endAngle) {
        double[] startOuter = polar(cx, cy, outer, startAngle);
        double[] endOuter = polar(cx, cy, outer, endAngle);
        double[] endInner = polar(cx, cy, inner, endAngle);
        double[] startInner = polar(cx, cy, inner, startAngle);
        int large = endAngle - startAngle > 180 ? 1 : 0;
        return "M " + point(startOuter) + " A " + outer + " " + outer + " 0 " + large + " 1 " + point(endOuter)
            + " L " + point(endInner) + " A " + inner + " " + inner + " 0 " + large + " 0 " + point(startInner) + " Z";
    }

    private double[] polar(double cx, double cy, double radius, double angle) {
        double radians = Math.toRadians(angle);
        return new double[]{cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)};
    }

    private String point(double[] value) { return formatNumber(value[0]) + " " + formatNumber(value[1]); }

    private String valueTable(String title, JsonNode items) {
        StringBuilder body = new StringBuilder("<div class='chart'><div class='chart-title'>").append(escape(title)).append("</div><table class='value-grid'>");
        for (int i = 0; i < Math.min(items.size(), 30); i += 2) {
            body.append("<tr>").append(valueCells(items.get(i)));
            if (i + 1 < items.size()) body.append(valueCells(items.get(i + 1)));
            else body.append("<td></td><td></td>");
            body.append("</tr>");
        }
        return body.append("</table></div>").toString();
    }

    private String valueCells(JsonNode item) {
        String label = item.path("label").asText(item.path("key").asText("—"));
        String unit = item.path("unit").asText("");
        return "<td>" + escape(label) + "</td><td>" + escape(formatNumber(numeric(item, "value", "current", "percent")) + " " + unit) + "</td>";
    }

    private String balanceChart(String title, JsonNode items, ReportMessages m) {
        StringBuilder body = new StringBuilder("<div class='chart'><div class='chart-title'>").append(escape(title)).append("</div>");
        for (int i = 0; i < Math.min(items.size(), 24); i++) {
            JsonNode item = items.get(i);
            double percent = Math.max(0, item.path("percent").asDouble());
            double width = Math.min(percent, 175) / 175d * 100;
            String color = percent >= 100 ? "#4A90E2" : "#F28C4C";
            body.append("<table class='balance-row'><tr><td class='balance-label'>").append(escape(item.path("label").asText("—")))
                .append("</td><td><div class='balance-track'><div class='balance-fill' style='width:").append(formatNumber(width))
                .append("%;background:").append(color).append("'></div></div></td><td class='balance-value'>")
                .append(escape(formatNumber(percent) + "%")).append("</td></tr></table>");
        }
        return body.append("<div class='balance-norm'>").append(escape(m.get("norm"))).append(" · 100%</div></div>").toString();
    }

    private String digestionChart(String title, JsonNode items, ReportMessages m) {
        List<Double> values = new ArrayList<>();
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < Math.min(items.size(), 30); i++) {
            JsonNode item = items.get(i);
            if (item.path("remaining").isNumber()) {
                values.add(item.path("remaining").asDouble());
                labels.add(formatNumber(item.path("time").asDouble()) + " " + m.get("hours"));
            }
        }
        return values.isEmpty() ? "" : lineChartSvg(title, values, labels, "#E74C3C");
    }

    private String lineChartSvg(String title, List<Double> values, List<String> labels, String color) {
        double max = Math.max(1, values.stream().mapToDouble(Double::doubleValue).max().orElse(1)) * 1.2;
        StringBuilder points = new StringBuilder();
        StringBuilder svg = new StringBuilder("<div class='chart'><div class='chart-title'>").append(escape(title))
            .append("</div><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 190'>");
        for (int tick = 0; tick <= 4; tick++) {
            double value = max * tick / 4;
            double y = 155 - tick * 32.5;
            svg.append("<line x1='48' y1='").append(formatNumber(y)).append("' x2='580' y2='").append(formatNumber(y))
                .append("' stroke='#dddddd' stroke-width='1'/><text x='42' y='").append(formatNumber(y + 3))
                .append("' font-size='8' fill='#858585' text-anchor='end'>").append(escape(formatNumber(value))).append("</text>");
        }
        for (int i = 0; i < values.size(); i++) {
            double x = values.size() == 1 ? 314 : 48 + i * 532d / (values.size() - 1);
            double y = 155 - values.get(i) / max * 130;
            if (!points.isEmpty()) points.append(' ');
            points.append(formatNumber(x)).append(',').append(formatNumber(y));
            if (i == 0 || i == values.size() - 1 || i == values.size() / 2) {
                svg.append("<text x='").append(formatNumber(x)).append("' y='174' font-size='8' fill='#858585' text-anchor='middle'>")
                    .append(escape(shorten(labels.get(i), 14))).append("</text>");
            }
        }
        svg.append("<polyline fill='none' stroke='").append(color).append("' stroke-width='3' points='").append(points).append("'/>");
        for (int i = 0; i < values.size(); i++) {
            double x = values.size() == 1 ? 314 : 48 + i * 532d / (values.size() - 1);
            double y = 155 - values.get(i) / max * 130;
            svg.append("<circle cx='").append(formatNumber(x)).append("' cy='").append(formatNumber(y)).append("' r='4' fill='").append(color).append("'/>");
        }
        return svg.append("</svg></div>").toString();
    }

    private String formatNumber(double value) {
        if (!Double.isFinite(value)) return "0";
        if (Math.abs(value - Math.rint(value)) < 0.000001) return String.format(Locale.ROOT, "%.0f", value);
        return String.format(Locale.ROOT, "%.2f", value).replaceAll("0+$", "").replaceAll("\\.$", "");
    }

    private String calculationTable(JsonNode result, ReportMessages m) {
        StringBuilder rows = new StringBuilder();
        appendCalculationRows(rows, result, "");
        if (rows.isEmpty()) return empty(m);
        return "<table class='appendix'><thead><tr><th>" + escape(m.get("parameter")) + "</th><th>"
            + escape(m.get("value")) + "</th></tr></thead><tbody>" + rows + "</tbody></table>";
    }

    private void appendCalculationRows(StringBuilder rows, JsonNode node, String path) {
        if (node == null || node.isNull()) {
            rows.append("<tr><td>").append(escape(path)).append("</td><td>—</td></tr>");
            return;
        }
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                String key = entry.getKey();
                String normalized = key.toLowerCase(Locale.ROOT);
                if (normalized.equals("ownerid") || normalized.equals("photoobjectkey") || normalized.equals("passportid")
                    || normalized.contains("token") || normalized.contains("secret")) return;
                appendCalculationRows(rows, entry.getValue(), path.isBlank() ? key : path + "." + key);
            });
            return;
        }
        if (node.isArray()) {
            for (int i = 0; i < node.size(); i++) appendCalculationRows(rows, node.get(i), path + "[" + i + "]");
            return;
        }
        if (visuallyRepresented(path)) return;
        rows.append("<tr><td>").append(escape(path)).append("</td><td>").append(escape(node.asText())).append("</td></tr>");
    }

    private boolean visuallyRepresented(String path) {
        if (path.equals("calories") || path.equals("dailyNorm") || path.equals("dailyCaloriesNorm")) return true;
        for (String prefix : List.of("composition[", "nutrition[", "nutrients[", "minerals[", "vitamins[")) {
            if (path.startsWith(prefix)) return true;
        }
        return path.matches("digestion\\.(protein|fat|carbs)\\[\\d+]\\.(time|remaining)");
    }

    private double numeric(JsonNode node, String... fields) {
        for (String field : fields) if (node.path(field).isNumber()) return node.path(field).asDouble();
        return 0;
    }

    private String readContraindications(PetContraindication value) {
        try {
            List<String> ingredients = objectMapper.readValue(
                value.getIngredientsJson(), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
            return String.join(", ", ingredients);
        } catch (Exception ex) {
            return "";
        }
    }

    private String pretty(JsonNode value) {
        try { return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value); }
        catch (Exception ex) { return value == null ? "" : value.toString(); }
    }

    private String filename(ReportMessages m, String type, String name) {
        String prefix = switch (m.locale()) {
            case "en" -> type.equals("pet") ? "pet-profile" : "recipe";
            case "kz" -> type.equals("pet") ? "ui-zhanuary-profili" : "retsept";
            default -> type.equals("pet") ? "profil-pitomtsa" : "retsept";
        };
        return prefix + "-" + sanitize(name) + ".pdf";
    }

    private String sanitize(String value) {
        String cleaned = value == null ? "report" : value.toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        return cleaned.isBlank() ? "report" : shorten(cleaned, 48);
    }

    private void enforceRecordLimit(int count) {
        if (count > properties.getMaxRecords()) throw new BadRequestException("Report contains too many records");
    }

    private String row(String label, Object value) { return "<tr>" + th(label) + td(value) + "</tr>"; }
    private String th(Object value) { return "<th>" + escape(value) + "</th>"; }
    private String td(Object value) { return "<td>" + escape(value) + "</td>"; }
    private String empty(ReportMessages m) { return "<p class='empty'>" + escape(m.get("none")) + "</p>"; }
    private void section(StringBuilder body, String title) { body.append("<h2>").append(escape(title)).append("</h2>"); }

    private String join(Object first, Object second) {
        String a = first == null ? "" : first.toString().trim();
        String b = second == null ? "" : second.toString().trim();
        if (a.isEmpty()) return b;
        if (b.isEmpty()) return a;
        return a + " · " + b;
    }

    private String shorten(String value, int max) { return value.length() <= max ? value : value.substring(0, max - 1) + "…"; }

    private String escape(Object raw) {
        if (raw == null || raw.toString().isBlank()) return "—";
        return raw.toString().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private UUID subject(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }

    @PreDestroy
    void closeRenderer() {
        renderer.shutdownNow();
    }
}
