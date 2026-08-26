package dev.pet.pets.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.pet.pets.dto.PublicPetProfileResponse;
import dev.pet.pets.error.GlobalExceptionHandler;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.service.PublicShareService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PublicShareControllerTest {
    private PublicShareService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(PublicShareService.class);
        mvc = MockMvcBuilders.standaloneSetup(new PublicShareController(service))
            .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void anonymousAggregateHasPrivacyHeaders() throws Exception {
        var response = new PublicPetProfileResponse(
            new PublicPetProfileResponse.PetDetails("Ақтөс", null, null, null, null, null, null, null, null, null, null, false, null),
            List.of(), new PublicPetProfileResponse.Contraindications(List.of(), ""), List.of()
        );
        when(service.pet("valid-token")).thenReturn(response);

        mvc.perform(get("/api/v1/public/shares/pet").header(PublicShareController.TOKEN_HEADER, "valid-token"))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(header().string("Referrer-Policy", "no-referrer"))
            .andExpect(header().string("X-Robots-Tag", "noindex, nofollow"))
            .andExpect(jsonPath("$.pet.name").value("Ақтөс"));
    }

    @Test
    void missingAndMalformedTokensUseTheSameNotFoundShape() throws Exception {
        when(service.pet(any())).thenThrow(new NotFoundException("Shared resource not found"));
        for (String token : new String[] { null, "malformed" }) {
            var request = get("/api/v1/public/shares/pet");
            if (token != null) request.header(PublicShareController.TOKEN_HEADER, token);
            mvc.perform(request).andExpect(status().isNotFound())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(jsonPath("$.error").value("not_found"))
                .andExpect(jsonPath("$.message").value("Shared resource not found"));
        }
    }
}
