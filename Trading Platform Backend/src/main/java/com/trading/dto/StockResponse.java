package com.trading.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockResponse {
    private Long id;
    private String symbol;
    private String companyName;
    private BigDecimal currentPrice;
    private LocalDateTime lastUpdated;
}