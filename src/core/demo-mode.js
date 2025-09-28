import { Logger } from '../utils/logger.js';

export class DemoMode {
  constructor(tradingEngine, config) {
    this.tradingEngine = tradingEngine;
    this.config = config;
    this.logger = new Logger(config.logging.level);
    this.mockPrices = new Map();
    this.isRunning = false;
    this.demoInterval = null;
    
    // Initialize mock prices for demo tokens
    this.initializeMockPrices();
  }

  initializeMockPrices() {
    // Mock token prices that will fluctuate
    this.mockPrices.set('DEMO_TOKEN_1', {
      basePrice: 100,
      currentPrice: 100,
      volatility: 0.02, // 2% volatility
      trend: 1 // 1 for upward, -1 for downward, 0 for sideways
    });
    
    this.mockPrices.set('DEMO_TOKEN_2', {
      basePrice: 50,
      currentPrice: 50,
      volatility: 0.03, // 3% volatility
      trend: -1
    });
    
    this.mockPrices.set('DEMO_TOKEN_3', {
      basePrice: 25,
      currentPrice: 25,
      volatility: 0.015, // 1.5% volatility
      trend: 0
    });
  }

  generateMockPrice(tokenData) {
    // Generate price movement based on trend and volatility
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const trendFactor = tokenData.trend * 0.001; // Small trend influence
    const volatilityFactor = randomFactor * tokenData.volatility;
    
    const priceChange = trendFactor + volatilityFactor;
    tokenData.currentPrice *= (1 + priceChange);
    
    // Occasionally change trend
    if (Math.random() < 0.05) { // 5% chance
      tokenData.trend = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    }
    
    return tokenData.currentPrice;
  }

  async runDemoAnalysis() {
    this.logger.info('Running demo analysis cycle');
    
    for (const [tokenMint, tokenData] of this.mockPrices) {
      const price = this.generateMockPrice(tokenData);
      
      // Simulate market data
      const marketData = {
        tokenMint,
        price,
        volume: Math.random() * 100000 + 10000, // Random volume
        timestamp: new Date()
      };
      
      // Analyze with trading strategy
      const signal = await this.tradingEngine.strategy.analyze(marketData);
      
      this.logger.debug('Demo analysis result', {
        token: tokenMint,
        price: price.toFixed(4),
        signal: signal.signal,
        confidence: signal.confidence?.toFixed(2),
        reasons: signal.reasons
      });
      
      // Simulate trading decisions
      if (signal.signal === 'BUY' && signal.confidence > 0.7) {
        this.logger.info('DEMO: Would execute BUY order', {
          token: tokenMint,
          price: price.toFixed(4),
          confidence: signal.confidence.toFixed(2)
        });
      } else if (signal.signal === 'SELL' && signal.confidence > 0.7) {
        this.logger.info('DEMO: Would execute SELL order', {
          token: tokenMint,
          price: price.toFixed(4),
          confidence: signal.confidence.toFixed(2)
        });
      }
    }
  }

  async start() {
    if (this.isRunning) {
      this.logger.warn('Demo mode is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting demo mode - simulated trading without real transactions');
    
    // Run initial analysis
    await this.runDemoAnalysis();
    
    // Set up recurring analysis (more frequent for demo)
    this.demoInterval = setInterval(async () => {
      try {
        await this.runDemoAnalysis();
      } catch (error) {
        this.logger.error('Error in demo analysis cycle', error);
      }
    }, 10000); // Every 10 seconds for demo

    this.logger.info('Demo mode started - watch for trading signals');
  }

  stop() {
    if (!this.isRunning) {
      this.logger.warn('Demo mode is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }

    this.logger.info('Demo mode stopped');
  }

  getDemoStatus() {
    const tokens = Array.from(this.mockPrices.entries()).map(([mint, data]) => ({
      mint,
      currentPrice: data.currentPrice.toFixed(4),
      trend: data.trend === 1 ? 'UP' : data.trend === -1 ? 'DOWN' : 'SIDEWAYS',
      volatility: (data.volatility * 100).toFixed(1) + '%'
    }));

    return {
      isRunning: this.isRunning,
      mockTokens: tokens,
      strategyStats: this.tradingEngine.strategy.getStrategyStats()
    };
  }
}

export default DemoMode;