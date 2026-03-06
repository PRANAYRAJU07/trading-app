import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, LogOut, User, Wallet } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(balance);
    };

    return (
        <nav className="navbar glass-card">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-brand">
                    <TrendingUp size={32} />
                    <span>MRU Trading</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/dashboard" className="navbar-link">
                        Dashboard
                    </Link>
                    <Link to="/market" className="navbar-link">
                        Market
                    </Link>
                    <Link to="/portfolio" className="navbar-link">
                        Portfolio
                    </Link>
                    <Link to="/transactions" className="navbar-link">
                        Transactions
                    </Link>
                </div>

                <div className="navbar-user">
                    <div className="navbar-balance">
                        <Wallet size={20} />
                        <span className="balance-amount">{formatBalance(user?.balance || 0)}</span>
                    </div>

                    <div className="navbar-profile">
                        <User size={20} />
                        <span>{user?.username}</span>
                    </div>

                    <button onClick={handleLogout} className="btn btn-outline btn-sm">
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
