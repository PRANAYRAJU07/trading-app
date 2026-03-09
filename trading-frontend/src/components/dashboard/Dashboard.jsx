import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import portfolioService from '../../services/portfolioService';
import stockService from '../../services/stockService';
import { Wallet, TrendingUp, TrendingDown, Activity, DollarSign, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
    const { user, refreshUser } = useAuth();
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [realizedPnl, setRealizedPnl] = useState(0);
    const [portfolio, setPortfolio] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = useCallback(async (showLoading = true) => {
        if (!user) return;
        try {
            if (showLoading) setLoading(true);

            // Parallel fetch for speed
            const [valueRes, portfolioRes, stocksRes, txRes, pnlRes] = await Promise.allSettled([
                portfolioService.getPortfolioValue(user.username),
                portfolioService.getUserPortfolio(user.username),
                stockService.getAllStocks(),
                portfolioService.getTransactionHistory(user.username),
                portfolioService.getRealizedProfitLoss(user.username),
            ]);

            if (valueRes.status === 'fulfilled' && valueRes.value?.success) {
                setPortfolioValue(Number(valueRes.value.data) || 0);
            }
            if (portfolioRes.status === 'fulfilled' && portfolioRes.value?.success) {
                setPortfolio(portfolioRes.value.data || []);
            }
            if (stocksRes.status === 'fulfilled' && stocksRes.value?.success) {
                setStocks(stocksRes.value.data || []);
            }
            if (txRes.status === 'fulfilled' && txRes.value?.success) {
                setTransactions((txRes.value.data || []).slice(0, 5));
            }
            if (pnlRes.status === 'fulfilled' && pnlRes.value?.success) {
                setRealizedPnl(Number(pnlRes.value.data) || 0);
            }

            setLastRefreshed(new Date());
        } catch (error) {
            toast.error('Failed to load dashboard data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Silent auto-refresh every 60 seconds
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => fetchDashboardData(false), 60000);
        return () => clearInterval(interval);
    }, [user, fetchDashboardData]);

    const handleManualRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData(false);
        setRefreshing(false);
        toast.success('Dashboard refreshed');
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value);

    const formatLastRefreshed = () => {
        if (!lastRefreshed) return '';
        const diffMs = Date.now() - lastRefreshed.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return `${diffSec}s ago`;
        const diffMin = Math.floor(diffSec / 60);
        return `${diffMin}m ago`;
    };

    const calculateTotalValue = () => (user?.balance || 0) + portfolioValue;

    // Unrealized P&L: current price vs avg buy price for still-held shares
    const calculateUnrealizedPnl = () =>
        portfolio.reduce((sum, item) => sum + Number(item.profitLoss || 0), 0);

    // Total P&L = realized gains from sold stocks + unrealized gains from current holdings
    const calculateTotalPnl = () => realizedPnl + calculateUnrealizedPnl();

    const getTopGainers = () =>
        [...stocks]
            .sort((a, b) => b.currentPrice - a.currentPrice)
            .slice(0, 3);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const totalPnl = calculateTotalPnl();

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome back, {user?.username}! 🎉</h1>
                    <p>Here's your trading overview</p>
                </div>
                <div className="dashboard-refresh">
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        title="Refresh dashboard data"
                    >
                        <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                    {lastRefreshed && (
                        <span className="last-refreshed text-muted">
                            Updated {formatLastRefreshed()}
                        </span>
                    )}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <Wallet size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Cash Balance</p>
                        <h3 className="stat-value">{formatCurrency(user?.balance || 0)}</h3>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Portfolio Value</p>
                        <h3 className="stat-value">{formatCurrency(portfolioValue)}</h3>
                        {portfolio.length === 0 && (
                            <p className="stat-hint text-muted">No open positions</p>
                        )}
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Value</p>
                        <h3 className="stat-value">{formatCurrency(calculateTotalValue())}</h3>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{
                        background: totalPnl >= 0
                            ? 'linear-gradient(135deg, #10b981, #34d399)'
                            : 'linear-gradient(135deg, #ef4444, #f87171)'
                    }}>
                        {totalPnl >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total P&amp;L</p>
                        <h3 className={`stat-value ${totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                            {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
                        </h3>
                        <div className="pnl-breakdown text-muted">
                            {realizedPnl !== 0 && (
                                <span title="Realized: from sold positions">
                                    R: {realizedPnl >= 0 ? '+' : ''}{formatCurrency(realizedPnl)}
                                </span>
                            )}
                            {calculateUnrealizedPnl() !== 0 && (
                                <span title="Unrealized: current holdings vs buy price">
                                    {' '}U: {calculateUnrealizedPnl() >= 0 ? '+' : ''}{formatCurrency(calculateUnrealizedPnl())}
                                </span>
                            )}
                            {realizedPnl === 0 && calculateUnrealizedPnl() === 0 && (
                                <span>No trades yet</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="dashboard-section">
                    <h2>
                        <Activity size={24} />
                        Top Gainers
                    </h2>
                    <div className="top-stocks">
                        {getTopGainers().map((stock) => (
                            <div key={stock.id} className="stock-item glass-card">
                                <div className="stock-info">
                                    <h4>{stock.symbol}</h4>
                                    <p>{stock.companyName}</p>
                                </div>
                                <div className="stock-price">
                                    <span className="price">{formatCurrency(stock.currentPrice)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>
                        <TrendingUp size={24} />
                        Recent Transactions
                    </h2>
                    <div className="transactions-list">
                        {transactions.length > 0 ? (
                            transactions.map((transaction) => (
                                <div key={transaction.id} className="transaction-item glass-card">
                                    <div className="transaction-type">
                                        <span className={`badge ${transaction.transactionType === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                                            {transaction.transactionType}
                                        </span>
                                    </div>
                                    <div className="transaction-details">
                                        <h4>{transaction.stockSymbol}</h4>
                                        <p>{transaction.quantity} shares @ {formatCurrency(transaction.pricePerShare)}</p>
                                    </div>
                                    <div className="transaction-amount">
                                        <span className={transaction.transactionType === 'BUY' ? 'text-danger' : 'text-success'}>
                                            {transaction.transactionType === 'BUY' ? '-' : '+'}{formatCurrency(transaction.totalAmount)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted">No transactions yet. Start trading!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
