import api from './api';

const stockService = {
  // Get all stocks
  getAllStocks: async () => {
    try {
      const response = await api.get('/stocks');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get stock by symbol
  getStockBySymbol: async (symbol) => {
    try {
      const response = await api.get(`/stocks/${symbol}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Trigger refresh of all stock prices from Alpha Vantage (runs in background; returns immediately)
  refreshAllPrices: async () => {
    try {
      const response = await api.post('/stocks/refresh-all');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default stockService;
