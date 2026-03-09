package com.trading.service;

import com.trading.dto.alphavantage.StockPriceUpdate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Runs stock price refresh on a schedule and on-demand (async).
 * Primary source: Yahoo Finance (no API key needed).
 * Fallback: Alpha Vantage (only if ALPHAVANTAGE_API_KEY is set).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockPriceRefreshService {

    private final YahooFinanceService yahooFinanceService;
    private final AlphaVantageService alphaVantageService;

    /** Refresh all stock prices every 15 minutes (runs in background). */
    @Scheduled(fixedDelayString = "${app.stock-refresh-interval-ms:900000}")
    public void scheduledRefresh() {
        log.info("Scheduled stock price refresh starting (Yahoo Finance)");
        refreshAllAsync();
    }

    /** Run full refresh in background; returns immediately. */
    @Async
    public CompletableFuture<List<StockPriceUpdate>> refreshAllAsync() {
        try {
            // Try Yahoo Finance first (no API key needed, always available)
            List<StockPriceUpdate> updates = yahooFinanceService.updateAllStockPrices();

            if (updates.isEmpty()) {
                // Yahoo Finance failed — fall back to Alpha Vantage
                log.warn("Yahoo Finance returned 0 updates, trying Alpha Vantage fallback");
                updates = alphaVantageService.updateAllStockPrices();
            }

            log.info("Stock price refresh completed: {} stocks updated", updates.size());
            return CompletableFuture.completedFuture(updates);
        } catch (Exception e) {
            log.error("Stock price refresh failed", e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
