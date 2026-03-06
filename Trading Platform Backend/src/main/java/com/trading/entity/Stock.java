package com.trading.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name = "stocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 10)
    private String symbol; // e.g., "AAPL", "GOOGL"
    @Column(nullable = false)
    private String companyName; // e.g., "Apple Inc."
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal currentPrice;
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}