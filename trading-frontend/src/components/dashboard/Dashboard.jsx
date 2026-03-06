import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import portfolioService from '../../services/portfolioService';
import stockService from '../../services/stockService';
import { Wallet, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
    const { user, refreshUser } = useAuth();
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [portfolio, setPortfolio] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Fetch portfolio value
            const valueResponse = await portfolioService.getPortfolioValue(user.username);
            if (valueResponse.success) {
                setPortfolioValue(valueResponse.data || 0);
            }

            // Fetch portfolio holdings
            const portfolioResponse = await portfolioService.getUserPortfolio(user.username);
            if (portfolioResponse.success) {
                setPortfolio(portfolioResponse.data || []);
            }

            // Fetch stocks
            const stocksResponse = await stockService.getAllStocks();
            if (stocksResponse.success) {
                setStocks(stocksResponse.data || []);
            }

            // Fetch recent transactions
            const transactionsResponse = await portfolioService.getTransactionHistory(user.username);
            if (transactionsResponse.success) {
                setTransactions((transactionsResponse.data || []).slice(0, 5));
            }
        } catch (error) {
            toast.error('Failed to load dashboard data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const calculateTotalValue = () => {
        return (user?.balance || 0) + portfolioValue;
    };

    const calculateProfitLoss = () => {
        const totalInvested = portfolio.reduce((sum, item) => {
            return sum + (item.averagePrice * item.quantity);
        }, 0);
        return portfolioValue - totalInvested;
    };

    const getTopGainers = () => {
        return stocks
            .sort((a, b) => b.currentPrice - a.currentPrice)
            .slice(0, 3);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome back, {user?.username}! 🎉</h1>
                <p>Here's your trading overview</p>
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
                    <div className="stat-icon" style={{ background: calculateProfitLoss() >= 0 ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #ef4444, #f87171)' }}>
                        {calculateProfitLoss() >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Profit/Loss</p>
                        <h3 className={`stat-value ${calculateProfitLoss() >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(calculateProfitLoss())}
                        </h3>
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
