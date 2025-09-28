# SolBanger101

An AI-powered trading agent for the Solana blockchain that automatically executes trades based on technical analysis and market momentum.

## Features

- **AI-Driven Trading**: Uses momentum-based strategies with technical indicators (SMA, EMA, RSI, MACD)
- **Risk Management**: Built-in stop-loss and take-profit mechanisms
- **Portfolio Management**: Automatic portfolio tracking and position management
- **Real-time Analysis**: Continuous market monitoring and trade execution
- **Configurable Strategies**: Support for multiple trading strategies
- **Comprehensive Logging**: Detailed logging and status reporting

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/Abelhubprog/SolBanger101.git
   cd SolBanger101
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Solana RPC URL and private key
   ```

3. **Run the Bot**
   ```bash
   # Start trading
   npm start

   # Check status
   npm start status

   # View portfolio
   npm start portfolio

   # Show help
   npm start help
   ```

## Configuration

Edit `.env` file with your settings:

- `RPC_URL`: Solana RPC endpoint (mainnet, devnet, or custom)
- `PRIVATE_KEY`: Your wallet's private key (base58 encoded)
- `MAX_POSITION_SIZE`: Maximum SOL to risk per position
- `STOP_LOSS_PERCENTAGE`: Stop loss threshold (%)
- `TAKE_PROFIT_PERCENTAGE`: Take profit threshold (%)
- `STRATEGY`: Trading strategy type (currently supports 'momentum')
- `TRADING_INTERVAL`: Analysis interval in milliseconds

## Architecture

```
src/
├── core/
│   ├── solana-client.js      # Solana blockchain interaction
│   ├── portfolio-manager.js  # Portfolio and position management
│   └── trading-engine.js     # Main trading logic and execution
├── strategies/
│   ├── base-strategy.js      # Abstract strategy class
│   └── momentum-strategy.js  # Momentum-based trading strategy
├── utils/
│   └── logger.js            # Logging utilities
├── config/
│   └── config.js            # Configuration management
└── index.js                 # Main application entry point
```

## Trading Strategy

The default momentum strategy uses:
- **Moving Averages**: Short (10) and Long (30) period SMAs for trend detection
- **RSI**: Relative Strength Index for overbought/oversold conditions
- **MACD**: Moving Average Convergence Divergence for momentum confirmation
- **Volume Analysis**: Trade volume confirmation (when available)

## Risk Management

- **Position Sizing**: Automatic calculation based on available capital
- **Stop Loss**: Configurable percentage-based stop losses
- **Take Profit**: Automatic profit-taking at target levels
- **Capital Preservation**: Keeps 10% buffer in SOL for transaction fees

## Disclaimer

⚠️ **This is experimental software for educational purposes. Trading cryptocurrencies involves significant risk. Never trade with funds you cannot afford to lose. Always test on devnet first.**

## License

MIT License - see LICENSE file for details.