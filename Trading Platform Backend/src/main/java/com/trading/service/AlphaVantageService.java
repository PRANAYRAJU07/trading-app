package com.trading.service;

import com.fasterxml.jackson.databind.JsonNode;
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

    @Value("${alphavantage.api.key:}")
    private String apiKey;

    @Value("${alphavantage.api.enabled:true}")
    private boolean apiEnabled;

    /**
     * Returns true only if Alpha Vantage is enabled AND the API key is configured.
     */
    private boolean isConfigured() {
        return apiEnabled && apiKey != null && !apiKey.isBlank();
    }

    /**
     * Fetch real-time stock quote from Alpha Vantage API.
     * Returns null if not configured or on any error.
     */
    public StockPriceUpdate fetchStockQuote(String symbol) {
        if (!isConfigured()) {
            log.warn("Alpha Vantage: API key not set — skipping fetch for {}. " +
                    "Set ALPHAVANTAGE_API_KEY env var on Render to enable.", symbol);
            return null;
        }

        try {
            log.info("Alpha Vantage: fetching quote for {}", symbol);

            // Fetch as JsonNode first so we can log the "Information" field on errors
            JsonNode rawNode = alphaVantageWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("function", "GLOBAL_QUOTE")
                            .queryParam("symbol", symbol)
                            .queryParam("apikey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (rawNode == null) {
                log.error("Alpha Vantage: null response for {}", symbol);
                return null;
            }

            // Alpha Vantage returns {"Information": "..."} when rate-limited or key invalid
            if (rawNode.has("Information")) {
                log.error("Alpha Vantage API message for {}: {}", symbol,
                        rawNode.path("Information").asText());
                return null;
            }

            // Also handle "Note" field (another Alpha Vantage rate-limit signal)
            if (rawNode.has("Note")) {
                log.warn("Alpha Vantage Note for {}: {}", symbol,
                        rawNode.path("Note").asText());
                return null;
            }

            JsonNode quoteNode = rawNode.path("Global Quote");
            String price = quoteNode.path("05. price").asText(null);

            if (price == null || price.isBlank()) {
                log.error("Alpha Vantage: no price data for {}. Raw: {}", symbol, rawNode);
                return null;
            }

            String prevClose = quoteNode.path("08. previous close").asText("0");
            String change = quoteNode.path("09. change").asText("0");
            String changePct = quoteNode.path("10. change percent").asText("0%");

            StockPriceUpdate update = new StockPriceUpdate();
            update.setSymbol(quoteNode.path("01. symbol").asText(symbol).toUpperCase());
            update.setPrice(new BigDecimal(price));
            update.setPreviousClose(new BigDecimal(prevClose));
            update.setChange(new BigDecimal(change));
            update.setChangePercent(changePct);
            update.setUpdatedAt(LocalDateTime.now());
            update.setSource("ALPHA_VANTAGE");

            log.info("Alpha Vantage: {} = ${}", symbol, price);
            return update;

        } catch (Exception e) {
            log.error("Alpha Vantage: error fetching {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    /**
     * Update a single stock price in the database.
     */
    @Transactional
    public boolean updateStockPrice(String symbol) {
        try {
            StockPriceUpdate priceUpdate = fetchStockQuote(symbol);

            if (priceUpdate == null) {
                log.error("Alpha Vantage: failed to fetch price for {}", symbol);
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
     * Update all stock prices via Alpha Vantage (rate-limited: 12s between calls).
     * Used as fallback when Yahoo Finance fails.
     */
    @Transactional
    public List<StockPriceUpdate> updateAllStockPrices() {
        if (!isConfigured()) {
            log.warn("Alpha Vantage: not configured, skipping batch update");
            return new ArrayList<>();
        }

        List<Stock> stocks = stockRepository.findAll();
        List<StockPriceUpdate> updates = new ArrayList<>();

        log.info("Alpha Vantage: starting batch update for {} stocks", stocks.size());

        for (Stock stock : stocks) {
            try {
                StockPriceUpdate update = fetchStockQuote(stock.getSymbol());

                if (update != null) {
                    stock.setCurrentPrice(update.getPrice());
                    stockRepository.save(stock);
                    updates.add(update);
                } else {
                    log.warn("Alpha Vantage: skipping update for {}", stock.getSymbol());
                }

                // Rate limiting: 12s between calls (5 calls/min on free tier)
                Thread.sleep(12000);

            } catch (InterruptedException e) {
                log.error("Thread interrupted during Alpha Vantage batch update");
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Error updating {}: {}", stock.getSymbol(), e.getMessage());
            }
        }

        log.info("Alpha Vantage batch update: {}/{} stocks updated",
                updates.size(), stocks.size());
        return updates;
    }

    /**
     * Get stock price without updating DB.
     */
    public StockPriceUpdate getStockPrice(String symbol) {
        return fetchStockQuote(symbol);
    }
}
