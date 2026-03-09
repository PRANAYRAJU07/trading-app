import api from './api';

const portfolioService = {
  // Get user portfolio
  getUserPortfolio: async (username) => {
    try {
      const response = await api.get(`/portfolio/${username}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get portfolio value (unrealized — current holdings only)
  getPortfolioValue: async (username) => {
    try {
      const response = await api.get(`/portfolio/${username}/value`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get realized P&L from all sold positions
  getRealizedProfitLoss: async (username) => {
    try {
      const response = await api.get(`/portfolio/${username}/realized-pnl`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get transaction history
  getTransactionHistory: async (username) => {
    try {
      const response = await api.get(`/portfolio/${username}/transactions`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default portfolioService;
