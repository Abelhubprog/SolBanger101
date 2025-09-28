import { Logger } from '../utils/logger.js';

export class PortfolioManager {
  constructor(solanaClient, config) {
    this.solanaClient = solanaClient;
    this.config = config;
    this.logger = new Logger(config.logging.level);
    this.positions = new Map();
    this.totalValue = 0;
    this.solBalance = 0;
  }

  async initialize() {
    try {
      await this.updatePortfolio();
      this.logger.info('Portfolio manager initialized', {
        totalValue: this.totalValue,
        solBalance: this.solBalance,
        positions: this.positions.size
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize portfolio manager', error);
      return false;
    }
  }

  async updatePortfolio() {
    try {
      // Update SOL balance
      const solBalance = await this.solanaClient.getBalance();
      this.solBalance = solBalance / 1e9; // Convert from lamports to SOL

      // Calculate total portfolio value
      this.totalValue = this.solBalance;
      
      // Add token positions value (placeholder for now)
      for (const [mint, position] of this.positions) {
        const price = await this.solanaClient.getTokenPrice(mint);
        if (price) {
          position.currentPrice = price;
          position.currentValue = position.amount * price;
          this.totalValue += position.currentValue;
        }
      }

      this.logger.debug('Portfolio updated', {
        solBalance: this.solBalance,
        totalValue: this.totalValue,
        positions: Array.from(this.positions.values())
      });
    } catch (error) {
      this.logger.error('Failed to update portfolio', error);
    }
  }

  addPosition(tokenMint, amount, entryPrice) {
    const position = {
      mint: tokenMint,
      amount,
      entryPrice,
      currentPrice: entryPrice,
      currentValue: amount * entryPrice,
      entryTime: new Date(),
      pnl: 0,
      pnlPercentage: 0
    };

    this.positions.set(tokenMint, position);
    this.logger.info('Position added', position);
    return position;
  }

  removePosition(tokenMint) {
    const position = this.positions.get(tokenMint);
    if (position) {
      this.positions.delete(tokenMint);
      this.logger.info('Position removed', position);
      return position;
    }
    return null;
  }

  getPosition(tokenMint) {
    return this.positions.get(tokenMint);
  }

  getAllPositions() {
    return Array.from(this.positions.values());
  }

  calculatePnL(tokenMint) {
    const position = this.positions.get(tokenMint);
    if (!position) return null;

    const pnl = (position.currentPrice - position.entryPrice) * position.amount;
    const pnlPercentage = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;

    position.pnl = pnl;
    position.pnlPercentage = pnlPercentage;

    return { pnl, pnlPercentage };
  }

  shouldStopLoss(tokenMint) {
    const position = this.positions.get(tokenMint);
    if (!position) return false;

    const pnlPercentage = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
    return pnlPercentage <= -this.config.trading.stopLossPercentage;
  }

  shouldTakeProfit(tokenMint) {
    const position = this.positions.get(tokenMint);
    if (!position) return false;

    const pnlPercentage = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
    return pnlPercentage >= this.config.trading.takeProfitPercentage;
  }

  getAvailableCapital() {
    return this.solBalance * 0.9; // Keep 10% as buffer
  }

  getPositionSize(price) {
    const availableCapital = this.getAvailableCapital();
    const maxSize = Math.min(this.config.trading.maxPositionSize, availableCapital);
    return Math.floor(maxSize / price);
  }

  getPortfolioSummary() {
    return {
      totalValue: this.totalValue,
      solBalance: this.solBalance,
      positionsCount: this.positions.size,
      positions: this.getAllPositions()
    };
  }
}

export default PortfolioManager;