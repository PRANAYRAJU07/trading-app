package com.trading;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class TradingPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(TradingPlatformApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("Trading Platform Backend Started");
        System.out.println("========================================\n");
    }
}