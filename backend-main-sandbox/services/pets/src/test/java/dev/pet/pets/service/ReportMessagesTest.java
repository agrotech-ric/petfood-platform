package dev.pet.pets.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.pet.pets.error.BadRequestException;
import org.junit.jupiter.api.Test;

class ReportMessagesTest {
    @Test
    void supportsOnlyTheThreeProductLocalesAndTheirGlyphSets() {
        assertThat(ReportMessages.forLocale("ru").get("petTitle")).contains("Профиль");
        assertThat(ReportMessages.forLocale("en").get("petTitle")).isEqualTo("Pet profile");
        assertThat(ReportMessages.forLocale("kz").get("petTitle")).contains("Үй жануары");
        assertThatThrownBy(() -> ReportMessages.forLocale("de"))
            .isInstanceOf(BadRequestException.class).hasMessage("Unsupported report locale");
    }
}
