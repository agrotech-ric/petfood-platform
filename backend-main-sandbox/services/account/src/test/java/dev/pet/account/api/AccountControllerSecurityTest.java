package dev.pet.account.api;

import dev.pet.account.config.AccountSecurityProperties;
import dev.pet.account.config.SessionCookieFactory;
import dev.pet.account.dto.LoginRequest;
import dev.pet.account.service.AccountService;
import dev.pet.account.service.AdminAuditService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AccountControllerSecurityTest {
    @Test
    void loginUsesCookieAndDoesNotReturnSidInJsonBody() {
        AccountService accounts = mock(AccountService.class);
        when(accounts.loginOrStart2fa(any(), anyString(), any())).thenReturn(
            AccountService.LoginResult.loggedIn("CANARY_SID_NEVER_IN_JSON")
        );
        AccountSecurityProperties properties = new AccountSecurityProperties();
        properties.setRateLimitPepper("test-pepper");
        AccountController controller = new AccountController(
            accounts, mock(AdminAuditService.class), new SessionCookieFactory(properties)
        );
        LoginRequest request = new LoginRequest();
        request.setEmail("canary@example.test");
        request.setPassword("irrelevant");
        MockHttpServletResponse response = new MockHttpServletResponse();

        var result = controller.loginByEmail(request, new MockHttpServletRequest(), response);

        Map<?, ?> body = (Map<?, ?>) result.getBody();
        assertThat(body.get("status")).isEqualTo("logged_in");
        assertThat(body.containsKey("sid")).isFalse();
        assertThat(response.getHeader("Set-Cookie")).contains("sid=CANARY_SID_NEVER_IN_JSON", "HttpOnly");
    }
}
