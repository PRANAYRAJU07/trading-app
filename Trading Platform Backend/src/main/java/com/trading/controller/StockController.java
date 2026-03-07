package com.trading.controller;

import com.trading.dto.ApiResponse;
import com.trading.dto.StockResponse;
import com.trading.dto.alphavantage.StockPriceUpdate;
import com.trading.service.AlphaVantageService;
import com.trading.service.StockPriceRefreshService;
import com.trading.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Stock Management", description = "APIs for viewing available stocks")
public class StockController {
    private final StockService stockService;
    private final AlphaVantageService alphaVantageService;
    private final StockPriceRefreshService stockPriceRefreshService;

    @Operation(summary = "Get all stocks", description = "Retrieve list of all available stocks with current prices")
    @GetMapping
    public ResponseEntity<ApiResponse> getAllStocks() {
        try {
            List<StockResponse> stocks = stockService.getAllStocks();
            return ResponseEntity.ok(new ApiResponse(true, "Stocks retrieved successfully", stocks));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(summary = "Get stock by symbol", description = "Retrieve stock details by symbol (e.g., AAPL, GOOGL)")
    @GetMapping("/{symbol}")
    public ResponseEntity<ApiResponse> getStockBySymbol(@PathVariable String symbol) {
        try {
            StockResponse stock = stockService.getStockResponseBySymbol(symbol);
            return ResponseEntity.ok(new ApiResponse(true, "Stock retrieved successfully", stock));
        } catch (Exception e) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(summary = "Refresh stock price", description = "Fetch latest price from Alpha Vantage and update database")
    @PostMapping("/{symbol}/refresh")
    public ResponseEntity<ApiResponse> refreshStockPrice(@PathVariable String symbol) {
        try {
            boolean success = alphaVantageService.updateStockPrice(symbol);

            if (success) {
                StockResponse stock = stockService.getStockResponseBySymbol(symbol);
                return ResponseEntity.ok(
                        new ApiResponse(true, "Stock price refreshed successfully", stock));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse(false, "Failed to refresh stock price"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(summary = "Refresh all stock prices", description = "Start background refresh from Alpha Vantage. Returns immediately; prices update in 1–2 min.")
    @PostMapping("/refresh-all")
    public ResponseEntity<ApiResponse> refreshAllStockPrices() {
        try {
            stockPriceRefreshService.refreshAllAsync();
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(
                    new ApiResponse(true,
                            "Price refresh started. Prices will update in 1–2 minutes.", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @Operation(summary = "Get live stock price", description = "Fetch current price from Alpha Vantage without updating database")
    @GetMapping("/{symbol}/live")
    public ResponseEntity<ApiResponse> getLiveStockPrice(@PathVariable String symbol) {
        try {
            StockPriceUpdate livePrice = alphaVantageService.getStockPrice(symbol);

            if (livePrice != null) {
                return ResponseEntity.ok(
                        new ApiResponse(true, "Live price fetched", livePrice));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Could not fetch live price"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}