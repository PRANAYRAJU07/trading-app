package com.trading.config;
import com.trading.entity.Stock;
import com.trading.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final StockRepository stockRepository;
    @Override
    public void run(String... args) {
        // Initialize sample stocks if database is empty
        if (stockRepository.count() == 0) {
            List<Stock> stocks = Arrays.asList(
                    createStock("AAPL", "Apple Inc.", "175.50"),
                    createStock("GOOGL", "Alphabet Inc.", "140.25"),
                    createStock("MSFT", "Microsoft Corporation", "380.75"),
                    createStock("AMZN", "Amazon.com Inc.", "155.30"),
                    createStock("TSLA", "Tesla Inc.", "245.60"),
                    createStock("META", "Meta Platforms Inc.", "485.90"),
                    createStock("NVDA", "NVIDIA Corporation", "725.40"),
                    createStock("NFLX", "Netflix Inc.", "590.80"),
                    createStock("DIS", "The Walt Disney Company", "95.20"),
                    createStock("PYPL", "PayPal Holdings Inc.", "65.75")
            );
            stockRepository.saveAll(stocks);
            System.out.println("✅ Initialized " + stocks.size() + " sample stocks");
        } else {
            System.out.println("✅ Stock data already exists (" + stockRepository.count() + " stocks)");
        }
    }
    private Stock createStock(String symbol, String companyName, String price) {
        Stock stock = new Stock();
        stock.setSymbol(symbol);
        stock.setCompanyName(companyName);
        stock.setCurrentPrice(new BigDecimal(price));
        return stock;
    }
}