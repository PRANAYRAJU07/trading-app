package com.trading.dto;
import com.trading.entity.Transaction.TransactionStatus;
import com.trading.entity.Transaction.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private String stockSymbol;
    private String companyName;
    private TransactionType transactionType;
    private Integer quantity;
    private BigDecimal pricePerShare;
    private BigDecimal totalAmount;
    private LocalDateTime transactionDate;
    private TransactionStatus status;
}