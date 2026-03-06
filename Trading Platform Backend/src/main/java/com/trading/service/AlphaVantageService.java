package com.trading.service;

import com.trading.dto.alphavantage.GlobalQuoteResponse;
import com.trading.dto.alphavantage.StockPriceUpdate;
import com.trading.entity.Stock;
import com.trading.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlphaVantageService {

    private final WebClient alphaVantageWebClient;
    private final StockRepository stockRepository;

    @Value("${alphavantage.api.key}")
    private String apiKey;

    @Value("${alphavantage.api.enabled:true}")
    private boolean apiEnabled;

    /**
     * Fetch real-time stock quote from Alpha Vantage API
     */
    public StockPriceUpdate fetchStockQuote(String symbol) {
        if (!apiEnabled) {
            log.warn("Alpha Vantage API is disabled");
            return null;
        }

        try {
            log.info("Fetching stock quote for: {}", symbol);

            GlobalQuoteResponse response = alphaVantageWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("function", "GLOBAL_QUOTE")
                            .queryParam("symbol", symbol)
                            .queryParam("apikey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(GlobalQuoteResponse.class)
                    .block();

            if (response == null || response.getGlobalQuote() == null) {
                log.error("No data received from Alpha Vantage for symbol: {}", symbol);
                return null;
            }

            GlobalQuoteResponse.GlobalQuote quote = response.getGlobalQuote();

            // Check if the response contains valid data
            if (quote.getPrice() == null || quote.getPrice().isEmpty()) {
                log.error("Invalid stock symbol or no data: {}", symbol);
                return null;
            }

            StockPriceUpdate update = new StockPriceUpdate();
            update.setSymbol(quote.getSymbol());
            update.setPrice(new BigDecimal(quote.getPrice()));
            update.setPreviousClose(new BigDecimal(quote.getPreviousClose()));
            update.setChange(new BigDecimal(quote.getChange()));
            update.setChangePercent(quote.getChangePercent());
            update.setUpdatedAt(LocalDateTime.now());
            update.setSource("ALPHA_VANTAGE");

            log.info("Successfully fetched price for {}: ${}", symbol, quote.getPrice());
            return update;

        } catch (Exception e) {
            log.error("Error fetching stock quote for {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    /**
     * Update stock price in database
     */
    @Transactional
    public boolean updateStockPrice(String symbol) {
        try {
            StockPriceUpdate priceUpdate = fetchStockQuote(symbol);

            if (priceUpdate == null) {
                log.error("Failed to fetch price for: {}", symbol);
                return false;
            }

            Stock stock = stockRepository.findBySymbol(symbol.toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Stock not found: " + symbol));

            stock.setCurrentPrice(priceUpdate.getPrice());
            stockRepository.save(stock);

            log.info("Updated {} price to ${}", symbol, priceUpdate.getPrice());
            return true;

        } catch (Exception e) {
            log.error("Error updating stock price for {}: {}", symbol, e.getMessage());
            return false;
        }
    }

    /**
     * Update all stock prices
     */
    @Transactional
    public List<StockPriceUpdate> updateAllStockPrices() {
        List<Stock> stocks = stockRepository.findAll();
        List<StockPriceUpdate> updates = new ArrayList<>();

        log.info("Starting batch update for {} stocks", stocks.size());

        for (Stock stock : stocks) {
            try {
                StockPriceUpdate update = fetchStockQuote(stock.getSymbol());

                if (update != null) {
                    stock.setCurrentPrice(update.getPrice());
                    stockRepository.save(stock);
                    updates.add(update);

                    // Rate limiting: wait 12 seconds between calls (5 calls per minute)
                    Thread.sleep(12000);
                } else {
                    log.warn("Skipping update for {}", stock.getSymbol());
                }

            } catch (InterruptedException e) {
                log.error("Thread interrupted during batch update");
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Error updating {}: {}", stock.getSymbol(), e.getMessage());
            }
        }

        log.info("Batch update completed. Updated {} out of {} stocks",
                updates.size(), stocks.size());
        return updates;
    }

    /**
     * Get stock price without updating database
     */
    public StockPriceUpdate getStockPrice(String symbol) {
        return fetchStockQuote(symbol);
    }
}
