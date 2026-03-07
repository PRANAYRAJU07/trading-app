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
 * Runs stock price refresh from Alpha Vantage on a schedule and on-demand (async).
 * Free tier: 5 API calls/minute, so refresh-all uses ~12s per stock.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockPriceRefreshService {

    private final AlphaVantageService alphaVantageService;

    /** Refresh all stock prices every 15 minutes (runs in background). */
    @Scheduled(fixedDelayString = "${app.stock-refresh-interval-ms:900000}")
    public void scheduledRefresh() {
        log.info("Scheduled stock price refresh starting");
        refreshAllAsync();
    }

    /** Run full refresh in background; returns immediately. */
    @Async
    public CompletableFuture<List<StockPriceUpdate>> refreshAllAsync() {
        try {
            List<StockPriceUpdate> updates = alphaVantageService.updateAllStockPrices();
            log.info("Stock price refresh completed: {} updated", updates.size());
            return CompletableFuture.completedFuture(updates);
        } catch (Exception e) {
            log.error("Stock price refresh failed", e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
