import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, LogOut, User, Wallet, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        navigate('/login');
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    const formatBalance = (balance) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(balance);
    };

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/market', label: 'Market' },
        { to: '/portfolio', label: 'Portfolio' },
        { to: '/transactions', label: 'Transactions' },
    ];

    return (
        <nav className="navbar glass-card">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-brand" onClick={closeMobileMenu}>
                    <TrendingUp size={32} />
                    <span>MRU Trading</span>
                </Link>

                <button
                    type="button"
                    className="navbar-mobile-toggle"
                    aria-label="Toggle menu"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {mobileMenuOpen && (
                    <div
                        className="navbar-overlay"
                        aria-hidden="true"
                        onClick={closeMobileMenu}
                    />
                )}

                <div className={`navbar-links ${mobileMenuOpen ? 'navbar-links-open' : ''}`}>
                    <div className="navbar-mobile-header">
                        <div className="navbar-mobile-user">
                            <div className="navbar-profile">
                                <User size={20} />
                                <span>{user?.username}</span>
                            </div>
                            <div className="navbar-balance">
                                <Wallet size={20} />
                                <span className="balance-amount">{formatBalance(user?.balance || 0)}</span>
                            </div>
                        </div>

                        <button onClick={handleLogout} className="btn btn-outline btn-sm navbar-mobile-logout">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>

                    {navLinks.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end
                            className={({ isActive }) =>
                                `navbar-link${isActive ? ' active' : ''}`
                            }
                            onClick={closeMobileMenu}
                        >
                            {label}
                        </NavLink>
                    ))}
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
