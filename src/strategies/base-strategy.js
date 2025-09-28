export class BaseStrategy {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.signals = [];
    this.isActive = false;
  }

  // Abstract methods to be implemented by concrete strategies
  async analyze(/* marketData */) {
    throw new Error('analyze method must be implemented by concrete strategy');
  }

  async generateSignal(/* marketData */) {
    throw new Error('generateSignal method must be implemented by concrete strategy');
  }

  // Common utility methods
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    
    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  calculateEMA(prices, period, smoothing = 2) {
    if (prices.length < period) return null;

    const sma = this.calculateSMA(prices.slice(0, period), period);
    if (!sma) return null;

    const multiplier = smoothing / (1 + period);
    let ema = sma;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gains and losses
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for the remaining prices
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26) {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    if (!fastEMA || !slowEMA) return null;

    const macdLine = fastEMA - slowEMA;
    
    // For simplicity, we'll return just the MACD line
    // In a full implementation, you'd also calculate the signal line and histogram
    return macdLine;
  }

  addSignal(signal) {
    this.signals.push({
      ...signal,
      timestamp: new Date(),
      strategy: this.name
    });

    // Keep only last 100 signals
    if (this.signals.length > 100) {
      this.signals = this.signals.slice(-100);
    }
  }

  getLatestSignals(count = 10) {
    return this.signals.slice(-count);
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }
}

export default BaseStrategy;