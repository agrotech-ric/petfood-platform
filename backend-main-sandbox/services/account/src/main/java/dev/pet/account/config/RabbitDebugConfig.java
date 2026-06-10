package dev.pet.account.config;

import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitDebugConfig {

    @Bean
    public CommandLineRunner rabbitConnectionProbe(
        CachingConnectionFactory cf,
        RabbitTemplate template
    ) {
        return args -> {
            System.out.println("[RABBIT-DEBUG] host=" + cf.getHost()
                + " port=" + cf.getPort()
                + " username=" + cf.getUsername()
                + " vhost=" + cf.getVirtualHost());

            try {
                template.execute(channel -> {
                    System.out.println("[RABBIT-DEBUG] Connected to broker at " + channel.getConnection().getAddress());
                    return null;
                });
            } catch (Exception e) {
                System.out.println("[RABBIT-DEBUG] Connection failed:");
                e.printStackTrace(System.out);
            }
        };
    }
}
