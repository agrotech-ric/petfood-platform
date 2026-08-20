package dev.pet.account;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import dev.pet.account.config.AccountSecurityProperties;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "dev.pet.account.repository")
@EntityScan(basePackages = "dev.pet.account.domain")
@EnableConfigurationProperties(AccountSecurityProperties.class)
public class AccountApplication {
    public static void main(String[] args) {
        SpringApplication.run(AccountApplication.class, args);
    }
}
