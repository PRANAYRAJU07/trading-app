import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import stockService from '../../services/stockService';
import tradingService from '../../services/tradingService';
import toast from 'react-hot-toast';
import { Search, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
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

    useEffect(() => {
        fetchStocks();
    }, []);

    useEffect(() => {
        filterStocks();
    }, [searchTerm, stocks]);

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const response = await stockService.getAllStocks();
            if (response.success) {
                setStocks(response.data || []);
                setFilteredStocks(response.data || []);
            }
        } catch (error) {
            toast.error('Failed to load stocks');
            console.error(error);
        } finally {
            setLoading(false);
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
                            <p className="text-muted">Last updated: {new Date(stock.lastUpdated).toLocaleString()}</p>
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
