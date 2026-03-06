import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import portfolioService from '../../services/portfolioService';
import tradingService from '../../services/tradingService';
import toast from 'react-hot-toast';
import { Briefcase, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import './Portfolio.css';

const Portfolio = () => {
    const { user, refreshUser } = useAuth();
    const [portfolio, setPortfolio] = useState([]);
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState(null);
    const [sellQuantity, setSellQuantity] = useState(1);
    const [sellingStock, setSellingStock] = useState(false);

    useEffect(() => {
        fetchPortfolio();
    }, [user]);

    const fetchPortfolio = async () => {
        if (!user) return;

        try {
            setLoading(true);

            const [portfolioResponse, valueResponse] = await Promise.all([
                portfolioService.getUserPortfolio(user.username),
                portfolioService.getPortfolioValue(user.username),
            ]);

            if (portfolioResponse.success) {
                setPortfolio(portfolioResponse.data || []);
            }

            if (valueResponse.success) {
                setPortfolioValue(valueResponse.data || 0);
            }
        } catch (error) {
            toast.error('Failed to load portfolio');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSellClick = (holding) => {
        setSelectedStock(holding);
        setSellQuantity(1);
    };

    const handleSellStock = async () => {
        if (!selectedStock || sellQuantity < 1 || sellQuantity > selectedStock.quantity) return;

        try {
            setSellingStock(true);
            const response = await tradingService.sellStock({
                username: user.username,
                stockSymbol: selectedStock.stockSymbol,
                quantity: sellQuantity,
            });

            if (response.success) {
                toast.success(`Successfully sold ${sellQuantity} shares of ${selectedStock.stockSymbol}!`);
                setSelectedStock(null);
                setSellQuantity(1);
                await refreshUser();
                await fetchPortfolio();
            } else {
                toast.error(response.message || 'Failed to sell stock');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to sell stock');
        } finally {
            setSellingStock(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const calculateProfitLoss = (holding) => {
        return (holding.currentPrice - holding.averagePrice) * holding.quantity;
    };

    const calculateProfitLossPercentage = (holding) => {
        return ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100;
    };

    if (loading) {
        return (
            <div className="portfolio-loading">
                <div className="spinner"></div>
                <p>Loading portfolio...</p>
            </div>
        );
    }

    return (
        <div className="portfolio">
            <div className="portfolio-header">
                <div>
                    <h1>
                        <Briefcase size={32} />
                        My Portfolio
                    </h1>
                    <p>Manage your stock holdings</p>
                </div>

                <div className="portfolio-value glass-card">
                    <p className="value-label">Total Portfolio Value</p>
                    <h2 className="value-amount">{formatCurrency(portfolioValue)}</h2>
                </div>
            </div>

            {portfolio.length > 0 ? (
                <div className="holdings-grid">
                    {portfolio.map((holding) => {
                        const profitLoss = calculateProfitLoss(holding);
                        const profitLossPercent = calculateProfitLossPercentage(holding);
                        const isProfit = profitLoss >= 0;

                        return (
                            <div key={holding.id} className="holding-card glass-card">
                                <div className="holding-header">
                                    <div className="holding-symbol">{holding.stockSymbol}</div>
                                    <div className={`holding-badge ${isProfit ? 'badge-success' : 'badge-danger'}`}>
                                        {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        {profitLossPercent.toFixed(2)}%
                                    </div>
                                </div>

                                <div className="holding-body">
                                    <div className="holding-row">
                                        <span className="text-muted">Quantity:</span>
                                        <span className="holding-value">{holding.quantity} shares</span>
                                    </div>

                                    <div className="holding-row">
                                        <span className="text-muted">Avg. Price:</span>
                                        <span className="holding-value">{formatCurrency(holding.averagePrice)}</span>
                                    </div>

                                    <div className="holding-row">
                                        <span className="text-muted">Current Price:</span>
                                        <span className="holding-value">{formatCurrency(holding.currentPrice)}</span>
                                    </div>

                                    <div className="holding-row">
                                        <span className="text-muted">Total Value:</span>
                                        <span className="holding-value">{formatCurrency(holding.currentValue)}</span>
                                    </div>

                                    <div className="holding-row profit-loss">
                                        <span className="text-muted">Profit/Loss:</span>
                                        <span className={isProfit ? 'text-success' : 'text-danger'}>
                                            {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
                                        </span>
                                    </div>
                                </div>

                                <div className="holding-footer">
                                    <button
                                        onClick={() => handleSellClick(holding)}
                                        className="btn btn-danger btn-sm"
                                    >
                                        <DollarSign size={16} />
                                        Sell Stock
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-portfolio glass-card">
                    <Briefcase size={64} />
                    <h3>Your portfolio is empty</h3>
                    <p>Start trading to build your portfolio!</p>
                </div>
            )}

            {/* Sell Modal */}
            {selectedStock && (
                <div className="modal-overlay" onClick={() => setSelectedStock(null)}>
                    <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Sell {selectedStock.stockSymbol}</h2>
                            <button onClick={() => setSelectedStock(null)} className="modal-close">×</button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-stock-info">
                                <h3>{selectedStock.stockSymbol}</h3>
                                <p className="modal-price">{formatCurrency(selectedStock.currentPrice)} per share</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantity (Max: {selectedStock.quantity})</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedStock.quantity}
                                    value={sellQuantity}
                                    onChange={(e) => setSellQuantity(parseInt(e.target.value) || 1)}
                                    className="form-input"
                                />
                            </div>

                            <div className="modal-summary">
                                <div className="summary-row">
                                    <span>Price per share:</span>
                                    <span>{formatCurrency(selectedStock.currentPrice)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Quantity:</span>
                                    <span>{sellQuantity}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Total Amount:</span>
                                    <span className="text-success">{formatCurrency(selectedStock.currentPrice * sellQuantity)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setSelectedStock(null)} className="btn btn-outline">
                                Cancel
                            </button>
                            <button
                                onClick={handleSellStock}
                                className="btn btn-danger"
                                disabled={sellingStock || sellQuantity > selectedStock.quantity}
                            >
                                {sellingStock ? (
                                    <>
                                        <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <DollarSign size={16} />
                                        Confirm Sale
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;
