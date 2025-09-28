import dotenv from 'dotenv';

dotenv.config();

export const config = {
  solana: {
    rpcUrl: process.env.RPC_URL || 'https://api.devnet.solana.com',
    privateKey: process.env.PRIVATE_KEY || '',
  },
  trading: {
    maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '100'),
    stopLossPercentage: parseFloat(process.env.STOP_LOSS_PERCENTAGE || '5'),
    takeProfitPercentage: parseFloat(process.env.TAKE_PROFIT_PERCENTAGE || '15'),
    minLiquidity: parseFloat(process.env.MIN_LIQUIDITY || '50000'),
    tradingInterval: parseInt(process.env.TRADING_INTERVAL || '300000'), // 5 minutes
  },
  strategy: {
    type: process.env.STRATEGY || 'momentum',
    riskTolerance: process.env.RISK_TOLERANCE || 'medium',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  }
};

export default config;