package com.trading.service;
import com.trading.dto.StockResponse;
import com.trading.entity.Stock;
import com.trading.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class StockService {
    private final StockRepository stockRepository;
    public List<StockResponse> getAllStocks() {
        return stockRepository.findAll().stream()
                .map(this::mapToStockResponse)
                .collect(Collectors.toList());
    }
    public Stock getStockBySymbol(String symbol) {
        return stockRepository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Stock not found with symbol: " + symbol));
    }
    public StockResponse getStockResponseBySymbol(String symbol) {
        Stock stock = getStockBySymbol(symbol);
        return mapToStockResponse(stock);
    }
    private StockResponse mapToStockResponse(Stock stock) {
        return new StockResponse(
                stock.getId(),
                stock.getSymbol(),
                stock.getCompanyName(),
                stock.getCurrentPrice(),
                stock.getLastUpdated()
        );
    }
}