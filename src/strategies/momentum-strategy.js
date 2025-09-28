import { BaseStrategy } from './base-strategy.js';

export class MomentumStrategy extends BaseStrategy {
  constructor(config) {
    super('Momentum', config);
    this.shortPeriod = 10;
    this.longPeriod = 30;
    this.rsiPeriod = 14;
    this.rsiOverbought = 70;
    this.rsiOversold = 30;
    this.priceHistory = new Map();
  }

  async analyze(marketData) {
    const { tokenMint, price, volume } = marketData;
    
    // Store price history
    if (!this.priceHistory.has(tokenMint)) {
      this.priceHistory.set(tokenMint, []);
    }
    
    const prices = this.priceHistory.get(tokenMint);
    prices.push(price);
    
    // Keep only last 100 prices
    if (prices.length > 100) {
      prices.shift();
    }

    if (prices.length < this.longPeriod) {
      return { signal: 'HOLD', confidence: 0, reason: 'Insufficient data' };
    }

    // Calculate technical indicators
    const shortSMA = this.calculateSMA(prices, this.shortPeriod);
    const longSMA = this.calculateSMA(prices, this.longPeriod);
    const rsi = this.calculateRSI(prices, this.rsiPeriod);
    const macd = this.calculateMACD(prices);

    return this.generateSignal({
      tokenMint,
      price,
      volume,
      shortSMA,
      longSMA,
      rsi,
      macd,
      priceHistory: prices
    });
  }

  async generateSignal(data) {
    const { price, shortSMA, longSMA, rsi, macd, volume } = data;
    
    let signal = 'HOLD';
    let confidence = 0;
    let reasons = [];

    // Momentum signals
    if (shortSMA > longSMA) {
      reasons.push('Short SMA above Long SMA (bullish momentum)');
      confidence += 0.3;
    } else if (shortSMA < longSMA) {
      reasons.push('Short SMA below Long SMA (bearish momentum)');
      confidence -= 0.3;
    }

    // RSI signals
    if (rsi < this.rsiOversold) {
      reasons.push(`RSI oversold (${rsi.toFixed(2)})`);
      confidence += 0.25;
    } else if (rsi > this.rsiOverbought) {
      reasons.push(`RSI overbought (${rsi.toFixed(2)})`);
      confidence -= 0.25;
    }

    // MACD signals
    if (macd > 0) {
      reasons.push('MACD above zero (bullish)');
      confidence += 0.2;
    } else if (macd < 0) {
      reasons.push('MACD below zero (bearish)');
      confidence -= 0.2;
    }

    // Price momentum
    const priceChange = ((price - longSMA) / longSMA) * 100;
    if (Math.abs(priceChange) > 5) {
      if (priceChange > 0) {
        reasons.push(`Strong upward momentum (${priceChange.toFixed(2)}%)`);
        confidence += 0.15;
      } else {
        reasons.push(`Strong downward momentum (${priceChange.toFixed(2)}%)`);
        confidence -= 0.15;
      }
    }

    // Volume confirmation
    if (volume && volume > 0) {
      // Placeholder for volume analysis - in real implementation, 
      // you'd compare with average volume
      reasons.push('Volume present');
      confidence += 0.1;
    }

    // Determine final signal
    if (confidence > 0.4) {
      signal = 'BUY';
    } else if (confidence < -0.4) {
      signal = 'SELL';
    }

    // Cap confidence at 1.0
    confidence = Math.max(-1, Math.min(1, confidence));

    const signalData = {
      signal,
      confidence: Math.abs(confidence),
      reasons: reasons.join('; '),
      indicators: {
        shortSMA,
        longSMA,
        rsi,
        macd,
        priceChange
      }
    };

    this.addSignal(signalData);
    return signalData;
  }

  // Risk management specific to momentum strategy
  shouldExitPosition(currentPrice, entryPrice, positionType) {
    const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;
    
    if (positionType === 'LONG') {
      // Exit long position if momentum reverses
      return priceChange < -this.config.trading.stopLossPercentage;
    } else if (positionType === 'SHORT') {
      // Exit short position if upward momentum
      return priceChange > this.config.trading.stopLossPercentage;
    }
    
    return false;
  }

  getStrategyStats() {
    const recentSignals = this.getLatestSignals(20);
    const buySignals = recentSignals.filter(s => s.signal === 'BUY').length;
    const sellSignals = recentSignals.filter(s => s.signal === 'SELL').length;
    const holdSignals = recentSignals.filter(s => s.signal === 'HOLD').length;
    
    return {
      name: this.name,
      isActive: this.isActive,
      totalSignals: this.signals.length,
      recentSignals: {
        buy: buySignals,
        sell: sellSignals,
        hold: holdSignals
      },
      avgConfidence: recentSignals.reduce((sum, s) => sum + s.confidence, 0) / recentSignals.length || 0,
      tokensTracked: this.priceHistory.size
    };
  }
}

export default MomentumStrategy;