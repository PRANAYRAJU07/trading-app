package com.trading.service;
import com.trading.dto.BuyStockRequest;
import com.trading.dto.SellStockRequest;
import com.trading.dto.TransactionResponse;
import com.trading.entity.*;
import com.trading.entity.Transaction.TransactionStatus;
import com.trading.entity.Transaction.TransactionType;
import com.trading.repository.PortfolioRepository;
import com.trading.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
@Service
@RequiredArgsConstructor
public class TradingService {
    private final UserService userService;
    private final StockService stockService;
    private final PortfolioRepository portfolioRepository;
    private final TransactionRepository transactionRepository;
    /**
     * BUY STOCK LOGIC:
     * 1. Validate user exists
     * 2. Validate stock exists
     * 3. Calculate total cost
     * 4. Check if user has sufficient balance
     * 5. Deduct amount from user balance
     * 6. Update or create portfolio entry
     * 7. Save transaction record
     */
    @Transactional
    public TransactionResponse buyStock(BuyStockRequest request) {
        // 1. Get user
        User user = userService.getUserByUsername(request.getUsername());
        // 2. Get stock
        Stock stock = stockService.getStockBySymbol(request.getStockSymbol());
        // 3. Calculate total cost
        BigDecimal totalCost = stock.getCurrentPrice()
                .multiply(new BigDecimal(request.getQuantity()));
        // 4. Check sufficient balance
        if (user.getBalance().compareTo(totalCost) < 0) {
            // Save failed transaction
            Transaction failedTransaction = createTransaction(
                    user, stock, TransactionType.BUY,
                    request.getQuantity(), stock.getCurrentPrice(),
                    totalCost, TransactionStatus.FAILED
            );
            transactionRepository.save(failedTransaction);
            throw new RuntimeException("Insufficient balance. Available: $" + user.getBalance() +
                    ", Required: $" + totalCost);
        }
        try {
            // 5. Deduct from user balance
            BigDecimal newBalance = user.getBalance().subtract(totalCost);
            userService.updateBalance(user, newBalance);
            // 6. Update portfolio
            Portfolio portfolio = portfolioRepository
                    .findByUserIdAndStockId(user.getId(), stock.getId())
                    .orElse(null);
            if (portfolio == null) {
                // Create new portfolio entry
                portfolio = new Portfolio();
                portfolio.setUser(user);
                portfolio.setStock(stock);
                portfolio.setQuantity(request.getQuantity());
                portfolio.setAveragePrice(stock.getCurrentPrice());
            } else {
                // Update existing portfolio entry - calculate new average price
                BigDecimal currentTotal = portfolio.getAveragePrice()
                        .multiply(new BigDecimal(portfolio.getQuantity()));
                BigDecimal newTotal = currentTotal.add(totalCost);
                int newQuantity = portfolio.getQuantity() + request.getQuantity();
                BigDecimal newAveragePrice = newTotal.divide(
                        new BigDecimal(newQuantity), 2, RoundingMode.HALF_UP);
                portfolio.setQuantity(newQuantity);
                portfolio.setAveragePrice(newAveragePrice);
            }
            portfolioRepository.save(portfolio);
            // 7. Save successful transaction
            Transaction transaction = createTransaction(
                    user, stock, TransactionType.BUY,
                    request.getQuantity(), stock.getCurrentPrice(),
                    totalCost, TransactionStatus.SUCCESS
            );
            Transaction savedTransaction = transactionRepository.save(transaction);
            return mapToTransactionResponse(savedTransaction);
        } catch (Exception e) {
            // Save failed transaction
            Transaction failedTransaction = createTransaction(
                    user, stock, TransactionType.BUY,
                    request.getQuantity(), stock.getCurrentPrice(),
                    totalCost, TransactionStatus.FAILED
            );
            transactionRepository.save(failedTransaction);
            throw new RuntimeException("Transaction failed: " + e.getMessage());
        }
    }
    /**
     * SELL STOCK LOGIC:
     * 1. Validate user exists
     * 2. Validate stock exists
     * 3. Check if user owns this stock
     * 4. Check if user has sufficient quantity
     * 5. Calculate total amount to receive
     * 6. Add amount to user balance
     * 7. Update portfolio (reduce quantity or delete if selling all)
     * 8. Save transaction record
     */
    @Transactional
    public TransactionResponse sellStock(SellStockRequest request) {
        // 1. Get user
        User user = userService.getUserByUsername(request.getUsername());
        // 2. Get stock
        Stock stock = stockService.getStockBySymbol(request.getStockSymbol());
        // 3. Check if user owns this stock
        Portfolio portfolio = portfolioRepository
                .findByUserIdAndStockId(user.getId(), stock.getId())
                .orElseThrow(() -> new RuntimeException("You don't own any shares of " + stock.getSymbol()));
        // 4. Check if user has sufficient quantity
        if (portfolio.getQuantity() < request.getQuantity()) {
            throw new RuntimeException("Insufficient shares. You own " + portfolio.getQuantity() +
                    " shares, trying to sell " + request.getQuantity());
        }
        // 5. Calculate total amount to receive
        BigDecimal totalAmount = stock.getCurrentPrice()
                .multiply(new BigDecimal(request.getQuantity()));
        try {
            // 6. Add to user balance
            BigDecimal newBalance = user.getBalance().add(totalAmount);
            userService.updateBalance(user, newBalance);
            // 7. Update portfolio
            int newQuantity = portfolio.getQuantity() - request.getQuantity();
            if (newQuantity == 0) {
                // Sold all shares, delete portfolio entry
                portfolioRepository.delete(portfolio);
            } else {
                // Update quantity
                portfolio.setQuantity(newQuantity);
                portfolioRepository.save(portfolio);
            }
            // 8. Save successful transaction
            Transaction transaction = createTransaction(
                    user, stock, TransactionType.SELL,
                    request.getQuantity(), stock.getCurrentPrice(),
                    totalAmount, TransactionStatus.SUCCESS
            );
            Transaction savedTransaction = transactionRepository.save(transaction);
            return mapToTransactionResponse(savedTransaction);
        } catch (Exception e) {
            // Save failed transaction
            Transaction failedTransaction = createTransaction(
                    user, stock, TransactionType.SELL,
                    request.getQuantity(), stock.getCurrentPrice(),
                    totalAmount, TransactionStatus.FAILED
            );
            transactionRepository.save(failedTransaction);
            throw new RuntimeException("Transaction failed: " + e.getMessage());
        }
    }
    private Transaction createTransaction(User user, Stock stock, TransactionType type,
                                          Integer quantity, BigDecimal pricePerShare,
                                          BigDecimal totalAmount, TransactionStatus status) {
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setStock(stock);
        transaction.setTransactionType(type);
        transaction.setQuantity(quantity);
        transaction.setPricePerShare(pricePerShare);
        transaction.setTotalAmount(totalAmount);
        transaction.setStatus(status);
        return transaction;
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