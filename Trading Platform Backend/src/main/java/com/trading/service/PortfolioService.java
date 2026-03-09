package com.trading.service;

import com.trading.dto.PortfolioResponse;
import com.trading.dto.TransactionResponse;
import com.trading.entity.Portfolio;
import com.trading.entity.Transaction;
import com.trading.entity.User;
import com.trading.repository.PortfolioRepository;
import com.trading.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {
        private final UserService userService;
        private final PortfolioRepository portfolioRepository;
        private final TransactionRepository transactionRepository;

        public List<PortfolioResponse> getUserPortfolio(String username) {
                User user = userService.getUserByUsername(username);
                List<Portfolio> portfolios = portfolioRepository.findByUserId(user.getId());
                return portfolios.stream()
                                .map(this::mapToPortfolioResponse)
                                .collect(Collectors.toList());
        }

        public BigDecimal getPortfolioValue(String username) {
                List<PortfolioResponse> portfolio = getUserPortfolio(username);
                return portfolio.stream()
                                .map(PortfolioResponse::getTotalValue)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        /**
         * Realized P&L = sum of all SELL proceeds minus all BUY costs, per symbol.
         * Returns the net realized gain/loss across all fully-closed positions.
         * For open positions, unrealized P&L is tracked separately via
         * getPortfolioValue.
         */
        public BigDecimal getRealizedProfitLoss(String username) {
                User user = userService.getUserByUsername(username);
                List<Transaction> allTx = transactionRepository
                                .findByUserIdOrderByTransactionDateDesc(user.getId());

                // Track total BUY cost and total SELL proceeds per symbol
                Map<String, BigDecimal> buyCost = new HashMap<>();
                Map<String, BigDecimal> sellProceeds = new HashMap<>();
                Map<String, Integer> buyQty = new HashMap<>();
                Map<String, Integer> sellQty = new HashMap<>();

                for (Transaction tx : allTx) {
                        String sym = tx.getStock().getSymbol();
                        if (tx.getTransactionType() == Transaction.TransactionType.BUY) {
                                buyCost.merge(sym, tx.getTotalAmount(), BigDecimal::add);
                                buyQty.merge(sym, tx.getQuantity(), Integer::sum);
                        } else {
                                sellProceeds.merge(sym, tx.getTotalAmount(), BigDecimal::add);
                                sellQty.merge(sym, tx.getQuantity(), Integer::sum);
                        }
                }

                BigDecimal realized = BigDecimal.ZERO;
                for (String sym : sellProceeds.keySet()) {
                        BigDecimal sold = sellProceeds.getOrDefault(sym, BigDecimal.ZERO);
                        BigDecimal bought = buyCost.getOrDefault(sym, BigDecimal.ZERO);
                        int soldQty = sellQty.getOrDefault(sym, 0);
                        int boughtQty = buyQty.getOrDefault(sym, 0);
                        // Cost basis for the shares actually sold
                        BigDecimal costBasis = boughtQty > 0
                                        ? bought.multiply(BigDecimal.valueOf(soldQty))
                                                        .divide(BigDecimal.valueOf(boughtQty), 2,
                                                                        java.math.RoundingMode.HALF_UP)
                                        : BigDecimal.ZERO;
                        realized = realized.add(sold.subtract(costBasis));
                }
                return realized;
        }

        public List<TransactionResponse> getTransactionHistory(String username) {
                User user = userService.getUserByUsername(username);
                List<Transaction> transactions = transactionRepository
                                .findByUserIdOrderByTransactionDateDesc(user.getId());
                return transactions.stream()
                                .map(this::mapToTransactionResponse)
                                .collect(Collectors.toList());
        }

        private PortfolioResponse mapToPortfolioResponse(Portfolio portfolio) {
                BigDecimal currentPrice = portfolio.getStock().getCurrentPrice();
                BigDecimal totalValue = currentPrice.multiply(new BigDecimal(portfolio.getQuantity()));
                BigDecimal profitLoss = currentPrice.subtract(portfolio.getAveragePrice())
                                .multiply(new BigDecimal(portfolio.getQuantity()));
                return new PortfolioResponse(
                                portfolio.getId(),
                                portfolio.getStock().getSymbol(),
                                portfolio.getStock().getCompanyName(),
                                portfolio.getQuantity(),
                                portfolio.getAveragePrice(),
                                currentPrice,
                                totalValue,
                                profitLoss);
        }

        private TransactionResponse mapToTransactionResponse(Transaction transaction) {
                return new TransactionResponse(
                                transaction.getId(),
                                transaction.getStock().getSymbol(),
                                transaction.getStock().getCompanyName(),
                                transaction.getTransactionType(),
                                transaction.getQuantity(),
                                transaction.getPricePerShare(),
                                transaction.getTotalAmount(),
                                transaction.getTransactionDate(),
                                transaction.getStatus());
        }
}