import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import stockService from '../../services/stockService';
import tradingService from '../../services/tradingService';
import toast from 'react-hot-toast';
import { Search, TrendingUp, ShoppingCart, DollarSign, RefreshCw, Clock } from 'lucide-react';
import './Market.css';

const Market = () => {
    const { user, refreshUser } = useAuth();
    const [stocks, setStocks] = useState([]);
    const [filteredStocks, setFilteredStocks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [buyingStock, setBuyingStock] = useState(false);
    const [refreshingPrices, setRefreshingPrices] = useState(false);
    const [lastFetchedAt, setLastFetchedAt] = useState(null);
    const [, setTick] = useState(0); // forces re-render every second for live timestamps

    // 1-second ticker so relative timestamps update live
    useEffect(() => {
        const tick = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(tick);
    }, []);

    useEffect(() => {
        fetchStocks();
    }, []);

    // Poll for updated prices every 60 seconds (silent refresh, no loading spinner)
    useEffect(() => {
        const interval = setInterval(() => fetchStocks(false), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        filterStocks();
    }, [searchTerm, stocks]);

    const fetchStocks = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await stockService.getAllStocks();
            if (response.success) {
                setStocks(response.data || []);
                setFilteredStocks(response.data || []);
                setLastFetchedAt(new Date());
            }
        } catch (error) {
            toast.error('Failed to load stocks');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Convert a date to a short relative string like "5s ago", "2m ago", "1h ago"
    const timeAgo = (date) => {
        if (!date) return 'Never';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d)) return 'Unknown';
        const diffMs = Date.now() - d.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 5) return 'just now';
        if (diffSec < 60) return `${diffSec}s ago`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffH = Math.floor(diffMin / 60);
        return `${diffH}h ago`;
    };

    const handleRefreshPrices = async () => {
        try {
            setRefreshingPrices(true);
            const response = await stockService.refreshAllPrices();
            if (response.success) {
                toast.success('Price refresh started. Prices will update in 1–2 minutes.');
                // Poll a bit more often for the next 2 minutes so user sees updates
                const fastInterval = setInterval(() => fetchStocks(false), 15000);
                setTimeout(() => clearInterval(fastInterval), 120000);
            } else {
                toast.error(response.message || 'Failed to start refresh');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to start refresh');
        } finally {
            setRefreshingPrices(false);
        }
    };

    const filterStocks = () => {
        if (!searchTerm) {
            setFilteredStocks(stocks);
            return;
        }

        const filtered = stocks.filter((stock) =>
            stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStocks(filtered);
    };

    const handleBuyClick = (stock) => {
        setSelectedStock(stock);
        setQuantity(1);
    };

    const handleBuyStock = async () => {
        if (!selectedStock || quantity < 1) return;

        const totalCost = selectedStock.currentPrice * quantity;
        if (totalCost > user.balance) {
            toast.error('Insufficient balance!');
            return;
        }

        try {
            setBuyingStock(true);
            const response = await tradingService.buyStock({
                username: user.username,
                stockSymbol: selectedStock.symbol,
                quantity: quantity,
            });

            if (response.success) {
                toast.success(`Successfully bought ${quantity} shares of ${selectedStock.symbol}!`);
                setSelectedStock(null);
                setQuantity(1);
                await refreshUser();
            } else {
                toast.error(response.message || 'Failed to buy stock');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to buy stock');
        } finally {
            setBuyingStock(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value);
    };

    if (loading) {
        return (
            <div className="market-loading">
                <div className="spinner"></div>
                <p>Loading market data...</p>
            </div>
        );
    }

    return (
        <div className="market">
            <div className="market-header">
                <div>
                    <h1>
                        <TrendingUp size={32} />
                        Stock Market
                    </h1>
                    <p>Browse and trade available stocks</p>
                </div>

                <div className="market-header-actions">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search stocks by symbol or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handleRefreshPrices}
                        disabled={refreshingPrices}
                        title="Fetch latest prices from market (updates in 1–2 min)"
                    >
                        <RefreshCw size={18} className={refreshingPrices ? 'spin' : ''} />
                        {refreshingPrices ? 'Refreshing…' : 'Refresh prices'}
                    </button>
                </div>
            </div>

            <div className="stocks-grid">
                {filteredStocks.map((stock) => (
                    <div key={stock.id} className="stock-card glass-card">
                        <div className="stock-card-header">
                            <div className="stock-symbol">{stock.symbol}</div>
                            <div className="stock-price">{formatCurrency(stock.currentPrice)}</div>
                        </div>

                        <div className="stock-card-body">
                            <h3>{stock.companyName}</h3>
                            <p className="text-muted last-updated">
                                <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                                {timeAgo(stock.lastUpdated)}
                            </p>
                        </div>

                        <div className="stock-card-footer">
                            <button
                                onClick={() => handleBuyClick(stock)}
                                className="btn btn-success btn-sm"
                            >
                                <ShoppingCart size={16} />
                                Buy Stock
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredStocks.length === 0 && (
                <div className="no-results">
                    <p>No stocks found matching "{searchTerm}"</p>
                </div>
            )}

            {/* Price data freshness indicator */}
            {lastFetchedAt && (
                <div className="market-freshness text-muted">
                    <Clock size={13} />
                    Prices fetched {timeAgo(lastFetchedAt)} · auto-refreshes every 60s
                </div>
            )}

            {/* Buy Modal */}
            {selectedStock && (
                <div className="modal-overlay" onClick={() => setSelectedStock(null)}>
                    <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Buy {selectedStock.symbol}</h2>
                            <button onClick={() => setSelectedStock(null)} className="modal-close">×</button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-stock-info">
                                <h3>{selectedStock.companyName}</h3>
                                <p className="modal-price">{formatCurrency(selectedStock.currentPrice)} per share</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
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
                                    <span>{quantity}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Total Cost:</span>
                                    <span className="text-success">{formatCurrency(selectedStock.currentPrice * quantity)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Your Balance:</span>
                                    <span>{formatCurrency(user.balance)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setSelectedStock(null)} className="btn btn-outline">
                                Cancel
                            </button>
                            <button
                                onClick={handleBuyStock}
                                className="btn btn-success"
                                disabled={buyingStock || (selectedStock.currentPrice * quantity) > user.balance}
                            >
                                {buyingStock ? (
                                    <>
                                        <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <DollarSign size={16} />
                                        Confirm Purchase
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

export default Market;
