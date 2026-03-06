package com.trading.repository;
import com.trading.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    Optional<Portfolio> findByUserIdAndStockId(Long userId, Long stockId);
    List<Portfolio> findByUserId(Long userId);
    List<Portfolio> findByUserUsername(String username);
}