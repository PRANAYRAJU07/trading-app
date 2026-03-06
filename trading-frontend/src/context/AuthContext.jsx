import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        if (response.success && response.data) {
            setUser(response.data);
        }
        return response;
    };

    const register = async (userData) => {
        const response = await authService.register(userData);
        return response;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        if (user && user.username) {
            try {
                const response = await authService.getUserByUsername(user.username);
                if (response.success && response.data) {
                    setUser(response.data);
                }
            } catch (error) {
                console.error('Failed to refresh user:', error);
            }
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
