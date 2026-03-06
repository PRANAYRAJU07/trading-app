# MRU Trading Platform - React Frontend

A modern, full-stack trading platform built with React and Spring Boot. This frontend provides a stunning user interface for stock trading with real-time data, portfolio management, and transaction tracking.

## 🚀 Features

- **User Authentication**: Secure login and registration with $100,000 initial balance
- **Dashboard**: Real-time overview of balance, portfolio value, and recent transactions
- **Stock Market**: Browse and search available stocks with live prices
- **Trading**: Buy and sell stocks with instant balance updates
- **Portfolio Management**: Track holdings with profit/loss calculations
- **Transaction History**: Complete history of all trades with filtering
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Premium UI**: Dark theme with glassmorphism effects and smooth animations

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Chart.js** - Interactive charts (ready for integration)
- **Lucide React** - Modern icon library
- **React Hot Toast** - Elegant notifications

## 📋 Prerequisites

Before running the frontend, ensure you have:

1. **Node.js** (v16 or higher) and npm installed
2. **Backend Server** running on `http://localhost:8080`
   - Navigate to the backend directory
   - Run: `mvn spring-boot:run`
3. **MySQL Database** configured and running

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
trading-frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Login & Register
│   │   ├── dashboard/   # Dashboard & Navbar
│   │   ├── market/      # Stock market & trading
│   │   ├── portfolio/   # Portfolio management
│   │   └── transactions/# Transaction history
│   ├── context/         # React Context (Auth)
│   ├── services/        # API services
│   │   ├── api.js       # Axios instance
│   │   ├── authService.js
│   │   ├── stockService.js
│   │   ├── tradingService.js
│   │   └── portfolioService.js
│   ├── styles/          # Global CSS
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── index.html           # HTML template
├── package.json         # Dependencies
└── vite.config.js       # Vite configuration
```

## 🎨 Design System

The application uses a comprehensive design system with:

- **Color Palette**: Dark theme with vibrant accents
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale
- **Components**: Reusable button, form, and card styles
- **Animations**: Smooth transitions and hover effects
- **Glassmorphism**: Frosted glass effects on cards

## 🔌 API Integration

The frontend connects to the Spring Boot backend at `http://localhost:8080/api`:

- `POST /users/register` - User registration
- `POST /users/login` - User login
- `GET /stocks` - Get all stocks
- `POST /trading/buy` - Buy stocks
- `POST /trading/sell` - Sell stocks
- `GET /portfolio/{username}` - Get user portfolio
- `GET /portfolio/{username}/transactions` - Get transaction history

## 🧪 Testing the Application

### Test Flow:

1. **Register**: Create a new account (receives $100,000)
2. **Login**: Sign in with credentials
3. **Browse Market**: View available stocks
4. **Buy Stock**: Purchase shares (balance deducted)
5. **View Portfolio**: See holdings with profit/loss
6. **Sell Stock**: Sell shares (balance increased)
7. **View Transactions**: Check trade history

## 🎯 Key Features Explained

### Authentication
- User registration with validation
- Login with error handling
- Session persistence with localStorage
- Protected routes

### Dashboard
- Real-time balance display
- Portfolio value calculation
- Top gainers showcase
- Recent transactions

### Market
- Stock listing with search
- Real-time price display
- Buy modal with cost calculation
- Balance validation

### Portfolio
- Holdings with profit/loss
- Color-coded gains/losses
- Sell functionality
- Portfolio value tracking

### Transactions
- Complete trade history
- Filter by type (BUY/SELL)
- Transaction status badges
- Chronological ordering

## 🎨 UI/UX Highlights

- **Glassmorphism**: Frosted glass cards with backdrop blur
- **Dark Theme**: Easy on the eyes for extended trading sessions
- **Smooth Animations**: Fade-in, slide-in, and hover effects
- **Responsive**: Mobile-first design that works on all devices
- **Loading States**: Spinners and skeletons for better UX
- **Toast Notifications**: Real-time feedback for all actions

## 🔧 Configuration

### Backend URL
To change the backend URL, edit `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Change this
  // ...
});
```

## 📝 Notes

- User data is stored in localStorage for session persistence
- No JWT tokens implemented (simple authentication for demo)
- Stock prices are static (backend uses in-memory data)
- For production, implement proper authentication and real-time stock APIs

## 🚀 Future Enhancements

- Real-time stock price updates with WebSockets
- Interactive charts for stock price history
- Portfolio performance charts
- Advanced filtering and sorting
- Export transaction history
- Dark/Light theme toggle
- Multi-currency support

## 📄 License

This project is for educational purposes.

## 👨‍💻 Author

Built with ❤️ for MRU Trading Platform
