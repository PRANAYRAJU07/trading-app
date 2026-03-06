package com.trading.controller;
import com.trading.dto.ApiResponse;
import com.trading.dto.PortfolioResponse;
import com.trading.dto.TransactionResponse;
import com.trading.service.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Portfolio Management", description = "APIs for viewing portfolio and transaction history")
public class PortfolioController {
    private final PortfolioService portfolioService;
    @Operation(summary = "Get user portfolio",
            description = "Retrieve all stock holdings for a user with profit/loss calculations")
    @GetMapping("/{username}")
    public ResponseEntity<ApiResponse> getUserPortfolio(@PathVariable String username) {
        try {
            List<PortfolioResponse> portfolio = portfolioService.getUserPortfolio(username);
            return ResponseEntity.ok(new ApiResponse(true, "Portfolio retrieved successfully", portfolio));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
    @Operation(summary = "Get portfolio value",
            description = "Calculate total value of all holdings")
    @GetMapping("/{username}/value")
    public ResponseEntity<ApiResponse> getPortfolioValue(@PathVariable String username) {
        try {
            BigDecimal totalValue = portfolioService.getPortfolioValue(username);
            return ResponseEntity.ok(new ApiResponse(true, "Portfolio value calculated", totalValue));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
    @Operation(summary = "Get transaction history",
            description = "Retrieve all buy/sell transactions for a user")
    @GetMapping("/{username}/transactions")
    public ResponseEntity<ApiResponse> getTransactionHistory(@PathVariable String username) {
        try {
            List<TransactionResponse> transactions = portfolioService.getTransactionHistory(username);
            return ResponseEntity.ok(new ApiResponse(true, "Transaction history retrieved", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}