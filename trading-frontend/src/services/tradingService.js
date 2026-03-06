import api from './api';

const tradingService = {
  // Buy stock
  buyStock: async (buyRequest) => {
    try {
      const response = await api.post('/trading/buy', buyRequest);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Sell stock
  sellStock: async (sellRequest) => {
    try {
      const response = await api.post('/trading/sell', sellRequest);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default tradingService;
