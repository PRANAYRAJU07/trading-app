package com.trading.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.trading.dto.alphavantage.StockPriceUpdate;
import com.trading.entity.Stock;
import com.trading.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Fetches real-time stock prices from Yahoo Finance (no API key required).
 * Uses the unofficial chart endpoint: /v8/finance/chart/{SYMBOL}?interval=1d
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class YahooFinanceService {

    private final WebClient yahooFinanceWebClient;
    private final StockRepository stockRepository;

    /**
     * Fetch latest quote for a single symbol from Yahoo Finance.
     * Returns null if the symbol is invalid or the request fails.
     */
    public StockPriceUpdate fetchStockQuote(String symbol) {
        try {
            log.info("Yahoo Finance: fetching quote for {}", symbol);

            JsonNode root = yahooFinanceWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v8/finance/chart/{symbol}")
                            .queryParam("interval", "1d")
                            .queryParam("range", "1d")
                            .build(symbol))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (root == null) {
                log.error("Yahoo Finance: null response for {}", symbol);
                return null;
            }

            // Navigate the response tree
            JsonNode result = root
                    .path("chart")
                    .path("result");

            if (result.isMissingNode() || result.isEmpty() || !result.isArray()) {
                // Check for error message
                JsonNode error = root.path("chart").path("error");
                if (!error.isNull() && error.has("description")) {
                    log.error("Yahoo Finance error for {}: {}", symbol, error.path("description").asText());
                } else {
                    log.error("Yahoo Finance: no result data for {}", symbol);
                }
                return null;
            }

            JsonNode meta = result.get(0).path("meta");

            double price = meta.path("regularMarketPrice").asDouble(0);
            double prevClose = meta.path("chartPreviousClose").asDouble(0);

            if (price == 0) {
                // Try regularMarketDayHigh/Low average as fallback
                log.warn("Yahoo Finance: regularMarketPrice is 0 for {}, trying alternate fields", symbol);
                return null;
            }

            double change = price - prevClose;
            double changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

            StockPriceUpdate update = new StockPriceUpdate();
            update.setSymbol(symbol.toUpperCase());
            update.setPrice(BigDecimal.valueOf(price).setScale(2, RoundingMode.HALF_UP));
            update.setPreviousClose(BigDecimal.valueOf(prevClose).setScale(2, RoundingMode.HALF_UP));
            update.setChange(BigDecimal.valueOf(change).setScale(2, RoundingMode.HALF_UP));
            update.setChangePercent(String.format("%.2f%%", changePct));
            update.setUpdatedAt(LocalDateTime.now());
            update.setSource("YAHOO_FINANCE");

            log.info("Yahoo Finance: {} = ${}", symbol, price);
            return update;

        } catch (Exception e) {
            log.error("Yahoo Finance: error fetching {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    /**
     * Fetch all stocks from DB, update each price via Yahoo Finance.
     * Rate-limit: Yahoo Finance is lenient but we add a small delay to be polite.
     */
    @Transactional
    public List<StockPriceUpdate> updateAllStockPrices() {
        List<Stock> stocks = stockRepository.findAll();
        List<StockPriceUpdate> updates = new ArrayList<>();

        log.info("Yahoo Finance: starting batch update for {} stocks", stocks.size());

        for (Stock stock : stocks) {
            try {
                StockPriceUpdate update = fetchStockQuote(stock.getSymbol());

                if (update != null) {
                    stock.setCurrentPrice(update.getPrice());
                    stockRepository.save(stock);
                    updates.add(update);
                    log.info("Updated {} → ${}", stock.getSymbol(), update.getPrice());
                } else {
                    log.warn("Skipped {} (no price data)", stock.getSymbol());
                }

                // Small delay to be polite to Yahoo Finance servers
                Thread.sleep(500);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Batch update interrupted");
                break;
            } catch (Exception e) {
                log.error("Error updating {}: {}", stock.getSymbol(), e.getMessage());
            }
        }

        log.info("Yahoo Finance batch update done: {}/{} stocks updated", updates.size(), stocks.size());
        return updates;
    }
}
