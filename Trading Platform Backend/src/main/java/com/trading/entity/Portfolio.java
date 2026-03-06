package com.trading.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
@Entity
@Table(name = "portfolio",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "stock_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Portfolio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;
    @Column(nullable = false)
    private Integer quantity; // Number of shares owned
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal averagePrice; // Average purchase price per share
}