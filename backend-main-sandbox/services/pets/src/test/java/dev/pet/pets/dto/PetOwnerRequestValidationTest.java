package dev.pet.pets.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PetOwnerRequestValidationTest {
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsTelegramUsernameOrPhoneNumber() {
        assertThat(validator.validate(request("@owner_test"))).isEmpty();
        assertThat(validator.validate(request("87053345231"))).isEmpty();
        assertThat(validator.validate(request("+77053345231"))).isEmpty();
    }

    @Test
    void rejectsUnstructuredTelegramContact() {
        assertThat(validator.validate(request("telegram contact")))
            .anySatisfy(violation -> assertThat(violation.getPropertyPath().toString()).isEqualTo("telegram"));
    }

    private PetOwnerRequest request(String telegram) {
        PetOwnerRequest request = new PetOwnerRequest();
        request.setFullName("Owner");
        request.setTelegram(telegram);
        return request;
    }
}
