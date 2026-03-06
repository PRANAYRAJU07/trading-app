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
import java.util.List;
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
                profitLoss
        );
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
                transaction.getStatus()
        );
    }
}