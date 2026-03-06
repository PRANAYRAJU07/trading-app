package com.trading.dto.alphavantage;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockPriceUpdate {
    private String symbol;
    private BigDecimal price;
    private BigDecimal previousClose;
    private BigDecimal change;
    private String changePercent;
    private LocalDateTime updatedAt;
    private String source; // "ALPHA_VANTAGE" or "CACHE"
}
