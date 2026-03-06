import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import portfolioService from '../../services/portfolioService';
import toast from 'react-hot-toast';
import { Receipt, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import './Transactions.css';

const Transactions = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, BUY, SELL

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    useEffect(() => {
        filterTransactions();
    }, [filter, transactions]);

    const fetchTransactions = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const response = await portfolioService.getTransactionHistory(user.username);
            if (response.success) {
                setTransactions(response.data || []);
                setFilteredTransactions(response.data || []);
            }
        } catch (error) {
            toast.error('Failed to load transactions');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filterTransactions = () => {
        if (filter === 'ALL') {
            setFilteredTransactions(transactions);
        } else {
            setFilteredTransactions(transactions.filter(t => t.transactionType === filter));
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="transactions-loading">
                <div className="spinner"></div>
                <p>Loading transactions...</p>
            </div>
        );
    }

    return (
        <div className="transactions">
            <div className="transactions-header">
                <div>
                    <h1>
                        <Receipt size={32} />
                        Transaction History
                    </h1>
                    <p>View all your trading activities</p>
                </div>

                <div className="filter-buttons">
                    <button
                        className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setFilter('ALL')}
                    >
                        All
                    </button>
                    <button
                        className={`btn btn-sm ${filter === 'BUY' ? 'btn-success' : 'btn-outline'}`}
                        onClick={() => setFilter('BUY')}
                    >
                        <TrendingUp size={16} />
                        Buy
                    </button>
                    <button
                        className={`btn btn-sm ${filter === 'SELL' ? 'btn-danger' : 'btn-outline'}`}
                        onClick={() => setFilter('SELL')}
                    >
                        <TrendingDown size={16} />
                        Sell
                    </button>
                </div>
            </div>

            {filteredTransactions.length > 0 ? (
                <div className="transactions-list">
                    {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="transaction-card glass-card">
                            <div className="transaction-badge-wrapper">
                                <span className={`badge ${transaction.transactionType === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                                    {transaction.transactionType === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {transaction.transactionType}
                                </span>
                            </div>

                            <div className="transaction-content">
                                <div className="transaction-main">
                                    <h3>{transaction.stockSymbol}</h3>
                                    <p className="transaction-details">
                                        {transaction.quantity} shares @ {formatCurrency(transaction.pricePerShare)}
                                    </p>
                                    <p className="transaction-date">{formatDate(transaction.transactionDate)}</p>
                                </div>

                                <div className="transaction-amount-wrapper">
                                    <div className={`transaction-amount ${transaction.transactionType === 'BUY' ? 'text-danger' : 'text-success'}`}>
                                        {transaction.transactionType === 'BUY' ? '-' : '+'}
                                        {formatCurrency(transaction.totalAmount)}
                                    </div>
                                    <span className={`transaction-status badge ${transaction.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                                        {transaction.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-transactions glass-card">
                    <Receipt size={64} />
                    <h3>No transactions found</h3>
                    <p>
                        {filter === 'ALL'
                            ? 'Start trading to see your transaction history!'
                            : `No ${filter.toLowerCase()} transactions found.`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Transactions;
