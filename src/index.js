import { config } from './config/config.js';
import { Logger } from './utils/logger.js';
import { SolanaClient } from './core/solana-client.js';
import { PortfolioManager } from './core/portfolio-manager.js';
import { MomentumStrategy } from './strategies/momentum-strategy.js';
import { TradingEngine } from './core/trading-engine.js';
import { DemoMode } from './core/demo-mode.js';

class SolBanger101 {
  constructor() {
    this.logger = new Logger(config.logging.level);
    this.solanaClient = null;
    this.portfolioManager = null;
    this.strategy = null;
    this.tradingEngine = null;
    this.demoMode = null;
    this.isDemo = false;
  }

  async initialize(demoMode = false) {
    try {
      this.logger.info('Starting SolBanger101 AI Trading Agent');
      this.logger.info('Configuration loaded', {
        rpcUrl: config.solana.rpcUrl,
        strategy: config.strategy.type,
        riskTolerance: config.strategy.riskTolerance,
        tradingInterval: config.trading.tradingInterval / 1000 + 's',
        mode: demoMode ? 'DEMO' : 'LIVE'
      });

      // Initialize Solana client
      this.solanaClient = new SolanaClient(
        config.solana.rpcUrl,
        config.solana.privateKey
      );
      
      let solanaReady = true;
      if (!demoMode) {
        solanaReady = await this.solanaClient.initialize();
        if (!solanaReady) {
          this.logger.warn('Failed to connect to Solana RPC, falling back to demo mode');
          demoMode = true;
        }
      }

      // Initialize portfolio manager
      this.portfolioManager = new PortfolioManager(this.solanaClient, config);
      if (!demoMode) {
        const portfolioReady = await this.portfolioManager.initialize();
        if (!portfolioReady) {
          this.logger.warn('Failed to initialize portfolio manager, falling back to demo mode');
          demoMode = true;
        }
      }

      // Initialize trading strategy
      this.strategy = new MomentumStrategy(config);

      // Initialize trading engine
      this.tradingEngine = new TradingEngine(
        this.solanaClient,
        this.portfolioManager,
        this.strategy,
        config
      );
      
      const engineReady = await this.tradingEngine.initialize();
      if (!engineReady && !demoMode) {
        this.logger.warn('Failed to initialize trading engine, falling back to demo mode');
        demoMode = true;
      }

      // Initialize demo mode if needed
      if (demoMode) {
        this.isDemo = true;
        this.demoMode = new DemoMode(this.tradingEngine, config);
        this.logger.info('Demo mode initialized - no real trades will be executed');
      }

      this.logger.info('SolBanger101 initialized successfully', { 
        mode: this.isDemo ? 'DEMO' : 'LIVE' 
      });
      return true;
      
    } catch (error) {
      this.logger.error('Failed to initialize SolBanger101', error);
      return false;
    }
  }

  async start() {
    try {
      this.logger.info('Starting trading operations...');
      
      if (this.isDemo) {
        // Start demo mode
        await this.demoMode.start();
      } else {
        // Start the trading engine
        await this.tradingEngine.start();
      }
      
      // Set up status reporting
      this.setupStatusReporting();
      
      // Set up graceful shutdown
      this.setupGracefulShutdown();
      
      this.logger.info('SolBanger101 is now running!');
      this.logger.info('Press Ctrl+C to stop');
      
    } catch (error) {
      this.logger.error('Failed to start SolBanger101', error);
      process.exit(1);
    }
  }

  setupStatusReporting() {
    // Report status every 30 seconds in demo mode, 5 minutes in live mode
    const interval = this.isDemo ? 30000 : 5 * 60 * 1000;
    
    setInterval(() => {
      try {
        if (this.isDemo) {
          const status = this.demoMode.getDemoStatus();
          this.logger.info('Demo Status Report', status);
        } else {
          const status = this.tradingEngine.getEngineStatus();
          this.logger.info('Status Report', status);
        }
      } catch (error) {
        this.logger.error('Error generating status report', error);
      }
    }, interval);

    // Initial status report
    setTimeout(() => {
      if (this.isDemo) {
        const status = this.demoMode.getDemoStatus();
        this.logger.info('Initial Demo Status Report', status);
      } else {
        const status = this.tradingEngine.getEngineStatus();
        this.logger.info('Initial Status Report', status);
      }
    }, 5000);
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      this.logger.info('Received shutdown signal, stopping gracefully...');
      
      try {
        if (this.isDemo && this.demoMode) {
          this.demoMode.stop();
        } else if (this.tradingEngine) {
          await this.tradingEngine.stop();
        }
        
        // Final status report
        if (this.portfolioManager) {
          try {
            const finalStatus = this.portfolioManager.getPortfolioSummary();
            this.logger.info('Final Portfolio Status', finalStatus);
          } catch (error) {
            this.logger.debug('Could not get final portfolio status (demo mode)');
          }
        }
        
        this.logger.info('SolBanger101 stopped successfully');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  // CLI command methods
  async status() {
    if (this.isDemo && this.demoMode) {
      const status = this.demoMode.getDemoStatus();
      console.log('=== SolBanger101 Demo Status ===');
      console.log(`Mode: DEMO`);
      console.log(`Running: ${status.isRunning}`);
      console.log(`Strategy: ${status.strategyStats.name} (${status.strategyStats.isActive ? 'Active' : 'Inactive'})`);
      console.log(`Mock Tokens: ${status.mockTokens.length}`);
      status.mockTokens.forEach(token => {
        console.log(`  ${token.mint}: $${token.currentPrice} (${token.trend})`);
      });
      console.log('===============================');
    } else if (this.tradingEngine) {
      const status = this.tradingEngine.getEngineStatus();
      console.log('=== SolBanger101 Status ===');
      console.log(`Mode: LIVE`);
      console.log(`Running: ${status.isRunning}`);
      console.log(`Strategy: ${status.strategy.name} (${status.strategy.isActive ? 'Active' : 'Inactive'})`);
      console.log(`Portfolio Value: ${status.portfolio.totalValue} SOL`);
      console.log(`Positions: ${status.portfolio.positionsCount}`);
      console.log(`Watchlist: ${status.watchlistSize} tokens`);
      console.log('============================');
    } else {
      console.log('Trading engine not initialized');
    }
  }

  async portfolio() {
    if (this.isDemo) {
      console.log('=== Demo Portfolio ===');
      console.log('Demo mode - no real portfolio');
      console.log('Check status for mock trading activity');
      console.log('======================');
      return;
    }

    if (!this.portfolioManager) {
      console.log('Portfolio manager not initialized');
      return;
    }

    await this.portfolioManager.updatePortfolio();
    const summary = this.portfolioManager.getPortfolioSummary();
    
    console.log('=== Portfolio Summary ===');
    console.log(`Total Value: ${summary.totalValue.toFixed(4)} SOL`);
    console.log(`SOL Balance: ${summary.solBalance.toFixed(4)} SOL`);
    console.log(`Active Positions: ${summary.positionsCount}`);
    
    if (summary.positions.length > 0) {
      console.log('\n--- Positions ---');
      summary.positions.forEach(pos => {
        console.log(`${pos.mint.substring(0, 8)}... | ${pos.amount} tokens | PnL: ${pos.pnlPercentage?.toFixed(2) || 0}%`);
      });
    }
    console.log('========================');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const isDemoMode = args.includes('--demo') || process.env.DEMO_MODE === 'true';

  const bot = new SolBanger101();

  if (command === 'status') {
    await bot.initialize(isDemoMode);
    await bot.status();
    process.exit(0);
  } else if (command === 'portfolio') {
    await bot.initialize(isDemoMode);
    await bot.portfolio();
    process.exit(0);
  } else if (command === 'demo') {
    // Force demo mode
    await bot.initialize(true);
    await bot.start();
  } else if (command === 'help') {
    console.log('SolBanger101 AI Trading Agent');
    console.log('');
    console.log('Usage:');
    console.log('  npm start              - Start the trading bot');
    console.log('  npm start demo         - Start in demo mode (simulated trading)');
    console.log('  npm start status       - Show current status');
    console.log('  npm start portfolio    - Show portfolio summary');
    console.log('  npm start help         - Show this help');
    console.log('');
    console.log('Flags:');
    console.log('  --demo                 - Force demo mode for any command');
    console.log('');
    console.log('Environment variables:');
    console.log('  Copy .env.example to .env and configure your settings');
    console.log('  Set DEMO_MODE=true to always run in demo mode');
    process.exit(0);
  } else {
    // Default: start the bot
    const initialized = await bot.initialize(isDemoMode);
    if (initialized) {
      await bot.start();
    } else {
      process.exit(1);
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the application
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});