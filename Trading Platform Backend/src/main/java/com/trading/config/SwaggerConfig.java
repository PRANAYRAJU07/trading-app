package com.trading.config;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;
@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI tradingPlatformAPI() {
        Server localServer = new Server();
        localServer.setUrl("http://localhost:8080");
        localServer.setDescription("Local Development Server");
        Contact contact = new Contact();
        contact.setName("Trading Platform Team");
        contact.setEmail("support@tradingplatform.com");
        License license = new License()
                .name("Educational Use")
                .url("https://opensource.org/licenses/MIT");
        Info info = new Info()
                .title("Trading Platform Backend API")
                .version("1.0.0")
                .description("A mini Spring Boot trading platform demonstrating core trading operations for B.Tech students. " +
                        "Features include user management, stock trading (buy/sell), portfolio tracking, " +
                        "transaction history, and live stock data integration with Finnhub API.")
                .contact(contact)
                .license(license);
        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer));
    }
}