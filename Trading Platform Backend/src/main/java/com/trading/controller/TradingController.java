package com.trading.controller;
import com.trading.dto.ApiResponse;
import com.trading.dto.BuyStockRequest;
import com.trading.dto.SellStockRequest;
import com.trading.dto.TransactionResponse;
import com.trading.service.TradingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/trading")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Trading Operations", description = "Core APIs for buying and selling stocks")
public class TradingController {
    private final TradingService tradingService;
    @Operation(summary = "Buy stock",
            description = "Purchase stocks. Validates balance, deducts amount, updates portfolio, and saves transaction.")
    @PostMapping("/buy")
    public ResponseEntity<ApiResponse> buyStock(@Valid @RequestBody BuyStockRequest request) {
        try {
            TransactionResponse transaction = tradingService.buyStock(request);
            return ResponseEntity.ok(new ApiResponse(true, "Stock purchased successfully", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
    @Operation(summary = "Sell stock",
            description = "Sell stocks. Validates holdings, adds amount to balance, updates portfolio, and saves transaction.")
    @PostMapping("/sell")
    public ResponseEntity<ApiResponse> sellStock(@Valid @RequestBody SellStockRequest request) {
        try {
            TransactionResponse transaction = tradingService.sellStock(request);
            return ResponseEntity.ok(new ApiResponse(true, "Stock sold successfully", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}