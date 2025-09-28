import { Logger } from '../utils/logger.js';

export class TradingEngine {
  constructor(solanaClient, portfolioManager, strategy, config) {
    this.solanaClient = solanaClient;
    this.portfolioManager = portfolioManager;
    this.strategy = strategy;
    this.config = config;
    this.logger = new Logger(config.logging.level);
    this.isRunning = false;
    this.tradingInterval = null;
    this.watchlist = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'So11111111111111111111111111111111111111112',  // WSOL
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK (example)
    ];
  }

  async initialize() {
    try {
      this.logger.info('Initializing trading engine');
      
      // Initialize strategy
      this.strategy.activate();
      
      this.logger.info('Trading engine initialized', {
        strategy: this.strategy.name,
        watchlistSize: this.watchlist.length,
        tradingInterval: this.config.trading.tradingInterval
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize trading engine', error);
      return false;
    }
  }

  async start() {
    if (this.isRunning) {
      this.logger.warn('Trading engine is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting trading engine');

    // Run initial analysis
    await this.analyzeTradingOpportunities();

    // Set up recurring analysis
    this.tradingInterval = setInterval(async () => {
      try {
        await this.analyzeTradingOpportunities();
      } catch (error) {
        this.logger.error('Error in trading cycle', error);
      }
    }, this.config.trading.tradingInterval);

    this.logger.info('Trading engine started');
  }

  async stop() {
    if (!this.isRunning) {
      this.logger.warn('Trading engine is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }

    this.strategy.deactivate();
    this.logger.info('Trading engine stopped');
  }

  async analyzeTradingOpportunities() {
    this.logger.debug('Analyzing trading opportunities');
    
    try {
      // Update portfolio first
      await this.portfolioManager.updatePortfolio();
      
      // Check existing positions for exit signals
      await this.checkExistingPositions();
      
      // Analyze watchlist for new opportunities
      for (const tokenMint of this.watchlist) {
        await this.analyzeToken(tokenMint);
      }
      
    } catch (error) {
      this.logger.error('Error analyzing trading opportunities', error);
    }
  }

  async analyzeToken(tokenMint) {
    try {
      // Get current market data
      const price = await this.solanaClient.getTokenPrice(tokenMint);
      if (!price) {
        this.logger.debug('No price data available', { tokenMint });
        return;
      }

      // For this implementation, we'll use a placeholder volume
      // In a real implementation, you'd fetch this from a DEX API
      const marketData = {
        tokenMint,
        price,
        volume: 0, // Placeholder
        timestamp: new Date()
      };

      // Get strategy analysis
      const signal = await this.strategy.analyze(marketData);
      
      if (signal.signal === 'BUY' && signal.confidence > 0.6) {
        await this.considerBuyOrder(tokenMint, price, signal);
      } else if (signal.signal === 'SELL' && signal.confidence > 0.6) {
        await this.considerSellOrder(tokenMint, price, signal);
      }
      
    } catch (error) {
      this.logger.error('Error analyzing token', { tokenMint, error });
    }
  }

  async checkExistingPositions() {
    const positions = this.portfolioManager.getAllPositions();
    
    for (const position of positions) {
      try {
        const currentPrice = await this.solanaClient.getTokenPrice(position.mint);
        if (!currentPrice) continue;

        // Update position with current price
        position.currentPrice = currentPrice;
        this.portfolioManager.calculatePnL(position.mint);

        // Check stop loss
        if (this.portfolioManager.shouldStopLoss(position.mint)) {
          this.logger.warn('Stop loss triggered', { 
            mint: position.mint, 
            pnl: position.pnl 
          });
          await this.executeSellOrder(position.mint, currentPrice, 'STOP_LOSS');
        }
        
        // Check take profit
        else if (this.portfolioManager.shouldTakeProfit(position.mint)) {
          this.logger.info('Take profit triggered', { 
            mint: position.mint, 
            pnl: position.pnl 
          });
          await this.executeSellOrder(position.mint, currentPrice, 'TAKE_PROFIT');
        }
        
      } catch (error) {
        this.logger.error('Error checking position', { position, error });
      }
    }
  }

  async considerBuyOrder(tokenMint, price, signal) {
    try {
      // Check if we already have a position
      const existingPosition = this.portfolioManager.getPosition(tokenMint);
      if (existingPosition) {
        this.logger.debug('Already have position in token', { tokenMint });
        return;
      }

      // Calculate position size
      const positionSize = this.portfolioManager.getPositionSize(price);
      if (positionSize === 0) {
        this.logger.debug('Insufficient capital for position', { tokenMint, price });
        return;
      }

      this.logger.info('Considering buy order', {
        tokenMint,
        price,
        positionSize,
        signal: signal.signal,
        confidence: signal.confidence,
        reasons: signal.reasons
      });

      // In a real implementation, you would execute the actual trade here
      // For this demo, we'll simulate the trade
      await this.simulateBuyOrder(tokenMint, price, positionSize);
      
    } catch (error) {
      this.logger.error('Error considering buy order', { tokenMint, error });
    }
  }

  async considerSellOrder(tokenMint, price, signal) {
    try {
      const position = this.portfolioManager.getPosition(tokenMint);
      if (!position) {
        this.logger.debug('No position to sell', { tokenMint });
        return;
      }

      this.logger.info('Considering sell order', {
        tokenMint,
        price,
        amount: position.amount,
        signal: signal.signal,
        confidence: signal.confidence,
        reasons: signal.reasons
      });

      await this.executeSellOrder(tokenMint, price, 'STRATEGY_SIGNAL');
      
    } catch (error) {
      this.logger.error('Error considering sell order', { tokenMint, error });
    }
  }

  async simulateBuyOrder(tokenMint, price, amount) {
    // This is a simulation - in a real implementation, you'd create and send
    // a transaction to swap SOL for the token
    this.logger.info('SIMULATED BUY ORDER', {
      tokenMint,
      price,
      amount,
      totalCost: price * amount
    });

    // Add position to portfolio
    this.portfolioManager.addPosition(tokenMint, amount, price);
  }

  async executeSellOrder(tokenMint, price, reason) {
    const position = this.portfolioManager.getPosition(tokenMint);
    if (!position) {
      this.logger.error('No position found to sell', { tokenMint });
      return;
    }

    // This is a simulation - in a real implementation, you'd create and send
    // a transaction to swap the token back to SOL
    const totalValue = position.amount * price;
    const pnl = (price - position.entryPrice) * position.amount;
    
    this.logger.info('SIMULATED SELL ORDER', {
      tokenMint,
      price,
      amount: position.amount,
      totalValue,
      pnl,
      reason
    });

    // Remove position from portfolio
    this.portfolioManager.removePosition(tokenMint);
  }

  getEngineStatus() {
    return {
      isRunning: this.isRunning,
      strategy: this.strategy.getStrategyStats(),
      portfolio: this.portfolioManager.getPortfolioSummary(),
      watchlistSize: this.watchlist.length
    };
  }
}

export default TradingEngine;