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
import java.time.LocalDate;
import java.time.Period;
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
        PetContraindication contraindication = recipe.getPet() == null
            ? null
            : contraindicationRepository.findByPetId(recipe.getPet().getId()).orElse(null);
        return new GeneratedPdf(
            render(recipeHtml(recipe, contraindication, messages)),
            filename(messages, "recipe", recipe.getName())
        );
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

    private String recipeHtml(Recipe recipe, PetContraindication contraindication, ReportMessages m) {
        JsonNode result = recipe.getCalculationResult();
        Pet pet = recipe.getPet();
        StringBuilder body = new StringBuilder();

        body.append("<section class='prescription-page prescription-page-break'>")
            .append("<div class='prescription-date'><strong>").append(escape(m.get("date"))).append("</strong><br/>")
            .append(escape(recipeDate(recipe, m))).append("</div>")
            .append("<h1 class='prescription-title'>").append(escape(m.get("prescriptionTitle"))).append("</h1>")
            .append("<h2 class='recipe-name'>").append(escape(recipe.getName())).append("</h2>")
            .append("<p class='recipe-description'>").append(escape(recipe.getDescription())).append("</p>")
            .append("<table class='category-grid'><tr><td><strong>").append(escape(m.get("age"))).append("</strong><br/>")
            .append(escape(localizedValue(m, "ageCategory", recipe.getAgeCategory()))).append("</td><td><strong>")
            .append(escape(m.get("breedSize"))).append("</strong><br/>")
            .append(escape(localizedValue(m, "breedSize", recipe.getBreedSize()))).append("</td></tr></table>")
            .append("<div class='orange-rule'></div><h2 class='center-heading'>").append(escape(m.get("pet"))).append("</h2>");

        appendPrescriptionPet(body, pet, recipe, m);
        body.append("<h2 class='section-heading'>").append(escape(m.get("healthState"))).append("</h2>")
            .append("<table class='striped-table health-table'>")
            .append(prescriptionRow(m.get("condition"), join(recipe.getTargetDisorder(),
                recipe.getTargetHealthCondition() == null ? null : recipe.getTargetHealthCondition().getNameRu())))
            .append(prescriptionRow(m.get("symptoms"), String.join(", ",
                recipe.getTargetSymptoms().stream().map(item -> item.getName()).toList())))
            .append(prescriptionRow(m.get("contra"), contraindication == null ? null : readContraindications(contraindication)))
            .append("</table></section>");

        body.append("<section class='prescription-page prescription-page-break'>")
            .append("<h1 class='page-heading'>").append(escape(m.get("recipe"))).append("</h1>")
            .append("<table class='daily-metrics'><tr>")
            .append(prescriptionMetric(m.get("dailyCalorieRequirement"), result.path("dailyCaloriesNorm"), m.get("kcalPerDay")))
            .append(prescriptionMetric(m.get("dailyFoodAmount"), result.path("dailyNorm"), m.get("gramsPerDay")))
            .append("</tr></table>")
            .append("<table class='recipe-composition-layout'><tr><td class='ingredients-cell'>")
            .append(ingredientTable(recipe, result, m))
            .append("</td><td class='composition-chart-cell'>")
            .append(prescriptionDonut(result.path("composition"), "percent", "%", false))
            .append("</td></tr></table>")
            .append("<h2 class='center-heading nutrients-heading'>").append(escape(m.get("nutrientsHeading"))).append("</h2>")
            .append("<table class='macro-layout'><tr><td class='macro-chart-cell'>")
            .append(prescriptionDonut(result.path("nutrition"), "value", "", true))
            .append("</td><td>").append(macroTable(result.path("nutrition"), result.path("calories"), m))
            .append("</td></tr></table>")
            .append("<h2 class='center-heading daily-nutrients-heading'>").append(escape(m.get("dailyNutrientContent"))).append("</h2>")
            .append("<table class='nutrient-columns'><tr><td>")
            .append(nutrientTable(m.get("minerals"), result.path("minerals"), m))
            .append("</td><td>").append(nutrientTable(m.get("vitamins"), result.path("vitamins"), m))
            .append("</td></tr></table>")
            .append(otherNutrientsTable(result.path("nutrients"), m))
            .append("</section>");

        body.append("<section class='prescription-page recommendations-page'>")
            .append("<h1 class='page-heading recommendation-heading'>").append(escape(m.get("useRecommendations"))).append("</h1>")
            .append("<table class='striped-table recommendations-table'>")
            .append(prescriptionRow(m.get("feedingSchedule"), null))
            .append(prescriptionRow(m.get("servingEnergy"), null))
            .append(prescriptionRow(m.get("applicationDuration"), null))
            .append("</table>")
            .append(prescriptionTextSection(m.get("introductionMethod"), m.get("introductionMethodText")))
            .append(prescriptionTextSection(m.get("preparation"), m.get("preparationText")))
            .append(prescriptionTextSection(m.get("storageConditions"), m.get("storageConditionsText")))
            .append("<div class='legal-block'><h2>").append(escape(m.get("warnings"))).append("</h2><ul>");
        for (String key : List.of("warning1", "warning2", "warning3", "warning4")) {
            body.append("<li>").append(escape(m.get(key))).append("</li>");
        }
        body.append("</ul></div><div class='consent-block'><h2>").append(escape(m.get("consent")))
            .append("</h2><p><span class='checkbox'>&#9744;</span> ").append(escape(m.get("consentText")))
            .append("</p></div>").append(signatureBlock(m)).append("</section>");

        return recipeDocument(body.toString(), m);
    }

    private void appendPrescriptionPet(StringBuilder body, Pet pet, Recipe recipe, ReportMessages m) {
        if (pet == null) {
            body.append("<div class='pet-empty'>").append(escape(m.get("none"))).append("</div>");
            return;
        }
        String image = imageData(pet);
        body.append("<table class='pet-summary'><tr><td class='pet-photo-cell'>");
        if (image == null) {
            body.append("<div class='pet-photo-placeholder'>—</div>");
        } else {
            body.append("<img src='").append(image).append("' alt='' />");
        }
        body.append("</td><td class='pet-identity'><strong>").append(escape(pet.getName())).append("</strong><br/>")
            .append(escape(petAge(pet, recipe, m))).append("<br/>")
            .append(escape(m.get("id"))).append(": ").append(escape(pet.getId())).append("</td></tr></table>")
            .append("<table class='striped-table pet-facts'>")
            .append(prescriptionRow(m.get("breed"), pet.getBreed() == null ? null : pet.getBreed().getName()))
            .append(prescriptionRow(m.get("birthDate"), formatDate(pet.getBirthDate(), m)))
            .append(prescriptionRow(m.get("weight"), pet.getWeightKg() == null ? null : formatNumber(pet.getWeightKg()) + " " + m.get("kg")))
            .append(prescriptionRow(m.get("gender"), localizedValue(m, "gender", pet.getGender())))
            .append(prescriptionRow(m.get("activity"), recipe.getTargetActivityType() == null ? null : recipe.getTargetActivityType().getName()))
            .append(prescriptionRow(m.get("reproductive"), pet.getReproductiveStatus() == null ? null : pet.getReproductiveStatus().getName()))
            .append(prescriptionRow(reproductiveDetailLabel(pet, m), pet.getReproductiveSubStatus() == null ? null : pet.getReproductiveSubStatus().getName()))
            .append(prescriptionRow(m.get("puppies"), pet.getPuppiesCount()))
            .append("</table>");
    }

    private String prescriptionMetric(String label, JsonNode value, String unit) {
        String rendered = value.isNumber() ? formatPrescriptionNumber(value.asDouble()) + " " + unit : "—";
        return "<td><div>" + escape(label) + "</div><strong>" + escape(rendered) + "</strong></td>";
    }

    private String ingredientTable(Recipe recipe, JsonNode result, ReportMessages m) {
        StringBuilder table = new StringBuilder("<table class='ingredients-table'><thead><tr><th></th><th>")
            .append(escape(m.get("ingredients"))).append("</th><th>%</th><th>")
            .append(escape(m.get("grams"))).append("</th></tr></thead><tbody>");
        if (!recipe.getIngredients().isEmpty()) {
            recipe.getIngredients().forEach(item -> table.append("<tr><td class='ingredient-check'>&#9744;</td><td>")
                .append(escape(ingredientName(item.getIngredient().getName(), item.getIngredient().getSubtype(), item.getIngredient().getCategory())))
                .append("</td><td>").append(escape(measure(item.getResultPercent(), "%")))
                .append("</td><td>").append(escape(measure(item.getResultGrams(), m.get("g")))).append("</td></tr>"));
        } else {
            JsonNode composition = result.path("composition");
            if (composition.isArray()) {
                for (JsonNode item : composition) {
                    table.append("<tr><td class='ingredient-check'>&#9744;</td><td>")
                        .append(escape(item.path("label").asText("—"))).append("</td><td>")
                        .append(escape(jsonMeasure(item, "percent", "%"))).append("</td><td>")
                        .append(escape(jsonMeasure(item, "grams", m.get("g")))).append("</td></tr>");
                }
            }
        }
        if (table.toString().endsWith("<tbody>")) {
            table.append("<tr><td></td><td colspan='3'>—</td></tr>");
        }
        return table.append("</tbody></table>").toString();
    }

    private String prescriptionDonut(JsonNode items, String valueField, String suffix, boolean macroPalette) {
        if (!items.isArray() || items.isEmpty()) return "<div class='empty-chart'>—</div>";
        String[] colors = macroPalette
            ? new String[]{"#4a8fe7", "#79d65d", "#ff9a57", "#ef4836", "#8e53b7"}
            : new String[]{"#ef4836", "#8e53b7", "#4a8fe7", "#79d65d", "#ff9a57"};
        int count = Math.min(items.size(), 12);
        double total = 0;
        for (int i = 0; i < count; i++) total += Math.max(0, items.get(i).path(valueField).asDouble());
        if (total <= 0) return "<div class='empty-chart'>—</div>";
        StringBuilder svg = new StringBuilder("<svg class='prescription-donut' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 190'>");
        double angle = -90;
        for (int i = 0; i < count; i++) {
            double value = Math.max(0, items.get(i).path(valueField).asDouble());
            if (value <= 0) continue;
            double sweep = value / total * 360;
            if (sweep >= 359.999) {
                svg.append("<circle cx='120' cy='88' r='52' fill='none' stroke='").append(colors[i % colors.length])
                    .append("' stroke-width='28'/>");
            } else {
                svg.append("<path d='").append(donutPath(120, 88, 66, 38, angle, angle + sweep))
                    .append("' fill='").append(colors[i % colors.length]).append("' stroke='#ffffff' stroke-width='1'/>");
            }
            double middle = Math.toRadians(angle + sweep / 2);
            svg.append("<text x='").append(formatNumber(120 + Math.cos(middle) * 83)).append("' y='")
                .append(formatNumber(91 + Math.sin(middle) * 83)).append("' font-size='9' text-anchor='middle' fill='")
                .append(colors[i % colors.length]).append("'>").append(escape(formatNumber(value) + suffix)).append("</text>");
            angle += sweep;
        }
        return svg.append("</svg>").toString();
    }

    private String macroTable(JsonNode items, JsonNode calories, ReportMessages m) {
        String[] colors = {"#4a8fe7", "#79d65d", "#ff9a57", "#ef4836", "#8e53b7"};
        StringBuilder table = new StringBuilder("<table class='macro-table'><thead><tr><th>")
            .append(escape(m.get("mainNutrients"))).append("</th><th>%</th></tr></thead><tbody>");
        if (items.isArray() && !items.isEmpty()) {
            for (int i = 0; i < items.size(); i++) {
                JsonNode item = items.get(i);
                table.append("<tr><td><span class='nutrient-dot' style='background:").append(colors[i % colors.length])
                .append("'></span>").append(escape(item.path("label").asText(item.path("key").asText("—"))))
                    .append("</td><td>").append(escape(jsonNumber(item.path("value")))).append("</td></tr>");
            }
        } else {
            table.append("<tr><td colspan='2'>—</td></tr>");
        }
        table.append("</tbody></table><p class='energy-density'><strong>").append(escape(m.get("energyValue")))
            .append(":</strong> ").append(escape(calories.isNumber() ? formatPrescriptionNumber(calories.asDouble()) + " " + m.get("kcalPer100g") : "—"))
            .append("</p>");
        return table.toString();
    }

    private String nutrientTable(String title, JsonNode items, ReportMessages m) {
        StringBuilder table = new StringBuilder("<table class='compact-nutrients'><thead><tr><th colspan='2'>")
            .append(escape(title)).append("</th></tr></thead><tbody>");
        if (!items.isArray() || items.isEmpty()) {
            return table.append("<tr><td colspan='2'>—</td></tr></tbody></table>").toString();
        }
        for (JsonNode item : items) {
            table.append("<tr><td>").append(escape(item.path("label").asText(item.path("key").asText("—"))))
                .append("</td><td>").append(escape(nutrientValue(item, m))).append("</td></tr>");
        }
        return table.append("</tbody></table>").toString();
    }

    private String otherNutrientsTable(JsonNode items, ReportMessages m) {
        StringBuilder body = new StringBuilder("<div class='other-nutrients'><h3>")
            .append(escape(m.get("otherNutrients"))).append("</h3><table><tr><td>");
        if (!items.isArray() || items.isEmpty()) {
            return body.append("—</td><td>—</td></tr></table></div>").toString();
        }
        int split = (items.size() + 1) / 2;
        body.append(nutrientSlice(items, 0, split, m)).append("</td><td>")
            .append(nutrientSlice(items, split, items.size(), m));
        return body.append("</td></tr></table></div>").toString();
    }

    private String nutrientSlice(JsonNode items, int start, int end, ReportMessages m) {
        StringBuilder table = new StringBuilder("<table class='compact-nutrients'><tbody>");
        for (int i = start; i < end; i++) {
            JsonNode item = items.get(i);
            table.append("<tr><td>").append(escape(item.path("label").asText(item.path("key").asText("—"))))
                .append("</td><td>").append(escape(nutrientValue(item, m))).append("</td></tr>");
        }
        return table.append("</tbody></table>").toString();
    }

    private String prescriptionTextSection(String title, String text) {
        return "<div class='text-section'><h2>" + escape(title) + "</h2><p>" + escape(text) + "</p></div>";
    }

    private String signatureBlock(ReportMessages m) {
        return "<table class='signatures'><tr><td><strong>" + escape(m.get("ownerFullName")) + "</strong><br/>"
            + "_____________________________<br/><strong>" + escape(m.get("signature")) + "</strong> &#160; ___________________<br/>"
            + "<strong>" + escape(m.get("date")) + "</strong> &#160;&#160;&#160;&#160; ___________________</td><td><strong>"
            + escape(m.get("veterinarianFullName")) + "</strong><br/>_____________________________<br/><strong>"
            + escape(m.get("signature")) + "</strong> &#160; ___________________<br/><strong>" + escape(m.get("date"))
            + "</strong> &#160;&#160;&#160;&#160; ___________________</td></tr></table>";
    }

    private String recipeDocument(String body, ReportMessages m) {
        return """
            <!DOCTYPE html><html lang='%s'><head><meta charset='UTF-8'/><style>
            @page { size: A4; margin: 12.5mm 20mm 18mm; @bottom-right { content: counter(page); font-family: 'Inter'; font-size: 9pt; color: #111111; } }
            * { box-sizing: border-box; }
            body { margin: 0; color: #111111; font-family: 'Inter', Arial, sans-serif; font-size: 10pt; line-height: 1.35; }
            table { width: 100%%; border-collapse: collapse; }
            tr, td, th, h1, h2, h3, .legal-block, .consent-block, .signatures { page-break-inside: avoid; }
            .prescription-page { width: 100%%; }
            .prescription-page-break { page-break-after: always; }
            .prescription-date { min-height: 17mm; text-align: right; }
            .prescription-title { margin: 0 0 7mm; font-size: 16pt; text-align: center; text-transform: uppercase; }
            .recipe-name { margin: 0 0 1mm; font-size: 13pt; }
            .recipe-description { min-height: 12mm; margin: 0 0 3mm; }
            .category-grid { margin-bottom: 3mm; table-layout: fixed; }
            .category-grid td { width: 50%%; padding: 1mm; text-align: center; }
            .orange-rule { border-top: 1.5px solid #f47e42; }
            .center-heading { margin: 7mm 0 3mm; font-size: 13pt; text-align: center; }
            .pet-summary { margin: 0 0 3mm; }
            .pet-summary td { border: 0; vertical-align: bottom; }
            .pet-photo-cell { width: 47mm; padding: 2mm 4mm; }
            .pet-photo-cell img, .pet-photo-placeholder { width: 40mm; height: 40mm; object-fit: cover; }
            .pet-photo-placeholder { padding-top: 16mm; background: #eeeeee; color: #777777; text-align: center; }
            .pet-identity { padding: 0 0 7mm 2mm; font-size: 10.5pt; }
            .pet-identity strong { font-size: 12pt; }
            .pet-empty { padding: 10mm 0; text-align: center; }
            .striped-table { margin: 0 0 5mm; table-layout: fixed; }
            .striped-table tr:nth-child(even) { background: #f8d7c1; }
            .striped-table th, .striped-table td { padding: 1.2mm 2mm; border: 0; text-align: left; vertical-align: top; }
            .striped-table th { width: 34%%; font-weight: bold; }
            .section-heading { margin: 6mm 0 0; padding-bottom: 1.5mm; border-bottom: 1.5px solid #f47e42; font-size: 13pt; }
            .health-table { margin-top: 0; }
            .page-heading { margin: 0 0 4mm; font-size: 16pt; text-align: left; }
            .daily-metrics { margin: 0 0 3mm; table-layout: fixed; }
            .daily-metrics td { width: 50%%; padding: 0 2mm 2mm; border: 0; text-align: center; }
            .daily-metrics strong { display: block; margin-top: 1mm; font-size: 13pt; }
            .recipe-composition-layout, .macro-layout, .nutrient-columns { table-layout: fixed; }
            .recipe-composition-layout > tbody > tr > td, .macro-layout > tbody > tr > td, .nutrient-columns > tbody > tr > td { width: 50%%; padding: 0 3mm 0 0; border: 0; vertical-align: top; }
            .recipe-composition-layout > tbody > tr > td:last-child, .macro-layout > tbody > tr > td:last-child, .nutrient-columns > tbody > tr > td:last-child { padding: 0 0 0 3mm; }
            .ingredients-table { font-size: 9pt; }
            .ingredients-table th { padding: 1mm; border-bottom: 1.5px solid #f47e42; text-align: left; }
            .ingredients-table td { padding: 1.2mm 1mm; border-bottom: 0.5px solid #cccccc; }
            .ingredients-table th:first-child, .ingredients-table td:first-child { width: 8mm; }
            .ingredients-table th:nth-child(3), .ingredients-table td:nth-child(3) { width: 14mm; text-align: right; }
            .ingredients-table th:nth-child(4), .ingredients-table td:nth-child(4) { width: 20mm; text-align: right; }
            .ingredient-check { font-size: 11pt; }
            .composition-chart-cell, .macro-chart-cell { text-align: center; }
            .prescription-donut { width: 62mm; height: 48mm; }
            .empty-chart { height: 42mm; padding-top: 18mm; color: #777777; text-align: center; }
            .nutrients-heading { margin: 2mm 0 1mm; }
            .macro-table { font-size: 9pt; }
            .macro-table th { padding: 1mm 2mm; border-bottom: 1.5px solid #f47e42; text-align: left; }
            .macro-table th:last-child, .macro-table td:last-child { width: 14mm; text-align: right; }
            .macro-table td { padding: 1.2mm 2mm; border-bottom: 0.5px solid #cccccc; }
            .nutrient-dot { display: inline-block; width: 3mm; height: 3mm; margin-right: 1.5mm; border-radius: 50%%; }
            .energy-density { margin: 2mm 0 0; padding-top: 2mm; border-top: 1px solid #777777; font-size: 9pt; }
            .daily-nutrients-heading { margin: 3mm 0 2mm; }
            .compact-nutrients { font-size: 8pt; }
            .compact-nutrients th { padding: 0.7mm; border-bottom: 1.5px solid #f47e42; text-align: center; }
            .compact-nutrients td { padding: 0.45mm 1.5mm; border: 0; }
            .compact-nutrients tr:nth-child(even) { background: #f8d7c1; }
            .compact-nutrients td:last-child { width: 28mm; text-align: right; white-space: nowrap; }
            .other-nutrients { margin-top: 2mm; }
            .other-nutrients h3 { margin: 0; padding-bottom: 0.7mm; border-bottom: 1.5px solid #f47e42; font-size: 9pt; text-align: center; }
            .other-nutrients > table { table-layout: fixed; }
            .other-nutrients > table > tbody > tr > td { width: 50%%; padding: 0 3mm 0 0; border: 0; vertical-align: top; }
            .other-nutrients > table > tbody > tr > td:last-child { padding: 0 0 0 3mm; }
            .recommendation-heading { margin-bottom: 1mm; text-align: center; }
            .recommendations-table { margin-bottom: 5mm; border-top: 1.5px solid #f47e42; border-bottom: 1.5px solid #f47e42; }
            .text-section { margin: 0 0 6mm; }
            .text-section h2, .legal-block h2, .consent-block h2 { margin: 0 0 1mm; font-size: 13pt; }
            .text-section p { margin: 0; }
            .legal-block { margin-top: 2mm; padding: 2mm 2mm 1mm; border-top: 1.5px solid #f47e42; border-bottom: 1.5px solid #f47e42; }
            .legal-block ul { margin: 1mm 0 1mm 8mm; padding-left: 4mm; }
            .legal-block li { margin: 0.5mm 0; }
            .consent-block { padding: 2mm; border-bottom: 1.5px solid #f47e42; }
            .consent-block p { margin: 0 0 0 6mm; }
            .checkbox { font-size: 12pt; }
            .signatures { margin-top: 11mm; table-layout: fixed; }
            .signatures td { width: 50%%; padding: 0 7mm 0 2mm; border: 0; line-height: 2; vertical-align: top; }
            .signatures td:last-child { padding: 0 2mm 0 7mm; }
            </style><title>%s</title></head><body>%s</body></html>
            """.formatted(escape(m.locale()), escape(m.get("prescriptionTitle")), body);
    }

    private String prescriptionRow(String label, Object value) {
        return "<tr><th>" + escape(label) + "</th><td>" + escape(value) + "</td></tr>";
    }

    private String ingredientName(String name, String subtype, String category) {
        if (subtype != null && !subtype.isBlank()) return name + " — " + subtype;
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase(name)) return name + " — " + category;
        return name;
    }

    private String measure(Double value, String unit) {
        return value == null || !Double.isFinite(value) ? "—" : formatPrescriptionNumber(value) + (unit.isBlank() ? "" : " " + unit);
    }

    private String jsonMeasure(JsonNode item, String field, String unit) {
        return item.path(field).isNumber() ? formatPrescriptionNumber(item.path(field).asDouble()) + (unit.isBlank() ? "" : " " + unit) : "—";
    }

    private String jsonNumber(JsonNode value) {
        return value.isNumber() ? formatPrescriptionNumber(value.asDouble()) : "—";
    }

    private String nutrientValue(JsonNode item, ReportMessages m) {
        JsonNode value = item.path("current").isNumber() ? item.path("current") : item.path("value");
        if (!value.isNumber()) return "—";
        String unit = item.path("unit").asText("");
        return formatPrescriptionNumber(value.asDouble()) + (unit.isBlank() ? "" : " " + localizedUnit(unit, m));
    }

    private String localizedUnit(String unit, ReportMessages m) {
        String key = "unit." + unit.trim().toLowerCase(Locale.ROOT);
        String translated = m.get(key);
        return translated.equals(key) ? unit : translated;
    }

    private String localizedValue(ReportMessages m, String group, Object raw) {
        if (raw == null || raw.toString().isBlank()) return null;
        String key = group + "." + raw.toString().trim().toLowerCase(Locale.ROOT);
        String translated = m.get(key);
        return translated.equals(key) ? raw.toString() : translated;
    }

    private String reproductiveDetailLabel(Pet pet, ReportMessages m) {
        if (pet.getReproductiveStatus() == null || pet.getReproductiveStatus().getCode() == null) {
            return m.get("reproductiveDetail");
        }
        return switch (pet.getReproductiveStatus().getCode()) {
            case "female_lactation" -> m.get("lactationWeek");
            case "female_pregnant" -> m.get("pregnancyPeriod");
            default -> m.get("reproductiveDetail");
        };
    }

    private String recipeDate(Recipe recipe, ReportMessages m) {
        LocalDate date = recipe.getCalculatedAt() != null ? recipe.getCalculatedAt().toLocalDate()
            : recipe.getUpdatedAt() != null ? recipe.getUpdatedAt().toLocalDate() : null;
        return formatDate(date, m);
    }

    private String formatDate(LocalDate date, ReportMessages m) {
        if (date == null) return null;
        String pattern = m.locale().equals("en") ? "MM/dd/yyyy" : "dd.MM.yyyy";
        return date.format(DateTimeFormatter.ofPattern(pattern));
    }

    private String petAge(Pet pet, Recipe recipe, ReportMessages m) {
        if (pet.getBirthDate() == null) return null;
        LocalDate onDate = recipe.getCalculatedAt() != null ? recipe.getCalculatedAt().toLocalDate()
            : recipe.getUpdatedAt() != null ? recipe.getUpdatedAt().toLocalDate() : LocalDate.now();
        if (pet.getBirthDate().isAfter(onDate)) return null;
        Period age = Period.between(pet.getBirthDate(), onDate);
        if (age.getYears() > 0) return age.getYears() + " " + pluralAge(age.getYears(), "year", m);
        return age.getMonths() + " " + pluralAge(age.getMonths(), "month", m);
    }

    private String pluralAge(int value, String unit, ReportMessages m) {
        if (m.locale().equals("en")) return m.get(unit + (value == 1 ? "One" : "Many"));
        if (m.locale().equals("kz")) return m.get(unit + "Many");
        int mod100 = value % 100;
        int mod10 = value % 10;
        if (mod100 >= 11 && mod100 <= 14) return m.get(unit + "Many");
        if (mod10 == 1) return m.get(unit + "One");
        if (mod10 >= 2 && mod10 <= 4) return m.get(unit + "Few");
        return m.get(unit + "Many");
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

    private String formatPrescriptionNumber(double value) {
        String raw = formatNumber(value);
        int decimal = raw.indexOf('.');
        String integer = decimal < 0 ? raw : raw.substring(0, decimal);
        String fraction = decimal < 0 ? "" : raw.substring(decimal);
        boolean negative = integer.startsWith("-");
        String digits = negative ? integer.substring(1) : integer;
        String grouped = digits.replaceAll("(?<=\\d)(?=(\\d{3})+$)", " ");
        return (negative ? "-" : "") + grouped + fraction;
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
