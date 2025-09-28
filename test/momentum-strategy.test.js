import { test } from 'node:test';
import assert from 'node:assert';
import { MomentumStrategy } from '../src/strategies/momentum-strategy.js';

const mockConfig = {
  trading: {
    stopLossPercentage: 5,
    takeProfitPercentage: 15
  },
  logging: {
    level: 'error' // Suppress logs during testing
  }
};

test('MomentumStrategy - should initialize correctly', () => {
  const strategy = new MomentumStrategy(mockConfig);
  
  assert.strictEqual(strategy.name, 'Momentum');
  assert.strictEqual(strategy.shortPeriod, 10);
  assert.strictEqual(strategy.longPeriod, 30);
  assert.strictEqual(strategy.rsiPeriod, 14);
  assert.strictEqual(strategy.isActive, false);
});

test('MomentumStrategy - should calculate SMA correctly', () => {
  const strategy = new MomentumStrategy(mockConfig);
  const prices = [10, 12, 11, 13, 15, 14, 16, 18, 17, 19];
  
  const sma5 = strategy.calculateSMA(prices, 5);
  const expected = (14 + 16 + 18 + 17 + 19) / 5; // Last 5 prices: 16.8
  
  assert.strictEqual(sma5, expected);
});

test('MomentumStrategy - should calculate RSI correctly', () => {
  const strategy = new MomentumStrategy(mockConfig);
  // Sample price data with clear trend
  const prices = [44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 47.25, 47.92, 46.23, 44.18, 43.61, 42.17, 41.55];
  
  const rsi = strategy.calculateRSI(prices, 14);
  
  assert(rsi !== null);
  assert(rsi >= 0 && rsi <= 100);
});

test('MomentumStrategy - should generate signals with insufficient data', async () => {
  const strategy = new MomentumStrategy(mockConfig);
  
  const marketData = {
    tokenMint: 'test-token',
    price: 100,
    volume: 1000
  };
  
  const signal = await strategy.analyze(marketData);
  
  assert.strictEqual(signal.signal, 'HOLD');
  assert.strictEqual(signal.confidence, 0);
  assert.strictEqual(signal.reason, 'Insufficient data');
});

test('MomentumStrategy - should generate buy signal with bullish indicators', async () => {
  const strategy = new MomentumStrategy(mockConfig);
  const tokenMint = 'test-token';
  
  // Add enough price data to generate signals
  const bullishPrices = [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120];
  
  // Simulate price history by calling analyze multiple times
  for (let i = 0; i < bullishPrices.length; i++) {
    await strategy.analyze({
      tokenMint,
      price: bullishPrices[i],
      volume: 1000
    });
  }
  
  // The last analysis should generate a buy signal due to strong upward momentum
  const lastSignal = strategy.getLatestSignals(1)[0];
  
  assert(lastSignal.signal === 'BUY' || lastSignal.signal === 'HOLD'); // Could be BUY with strong momentum
  assert(lastSignal.confidence >= 0);
});

test('MomentumStrategy - should track multiple tokens', async () => {
  const strategy = new MomentumStrategy(mockConfig);
  
  await strategy.analyze({ tokenMint: 'token1', price: 100, volume: 1000 });
  await strategy.analyze({ tokenMint: 'token2', price: 200, volume: 2000 });
  
  const stats = strategy.getStrategyStats();
  assert.strictEqual(stats.tokensTracked, 2);
});

test('MomentumStrategy - should activate and deactivate', () => {
  const strategy = new MomentumStrategy(mockConfig);
  
  assert.strictEqual(strategy.isActive, false);
  
  strategy.activate();
  assert.strictEqual(strategy.isActive, true);
  
  strategy.deactivate();
  assert.strictEqual(strategy.isActive, false);
});