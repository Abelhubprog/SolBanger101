import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Logger } from '../utils/logger.js';

export class SolanaClient {
  constructor(rpcUrl, privateKey) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.wallet = null;
    
    // Only try to create wallet if private key is provided and valid
    if (privateKey && privateKey.trim() !== '') {
      try {
        // Handle both base58 and JSON array formats
        if (privateKey.startsWith('[')) {
          this.wallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));
        } else {
          // For base58 format, you'd use a base58 decoder
          this.logger.warn('Base58 private key format not implemented in this demo');
        }
      } catch (error) {
        this.logger.warn('Invalid private key provided', error.message);
      }
    }
    
    this.logger = new Logger();
  }

  async initialize() {
    try {
      const version = await this.connection.getVersion();
      this.logger.info('Connected to Solana RPC', { version });
      
      if (this.wallet) {
        const balance = await this.getBalance();
        this.logger.info('Wallet initialized', { 
          publicKey: this.wallet.publicKey.toString(),
          balance: balance / LAMPORTS_PER_SOL 
        });
      } else {
        this.logger.info('No wallet configured - running in read-only mode');
      }
      
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Solana client', { 
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  async getBalance(publicKey = null) {
    try {
      const key = publicKey || this.wallet?.publicKey;
      if (!key) throw new Error('No public key provided');
      
      return await this.connection.getBalance(key);
    } catch (error) {
      this.logger.error('Failed to get balance', error);
      return 0;
    }
  }

  async getTokenBalance(tokenMint, owner = null) {
    try {
      const ownerKey = owner || this.wallet?.publicKey;
      if (!ownerKey) throw new Error('No owner key provided');

      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMint),
        ownerKey
      );

      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return parseFloat(balance.value.amount);
    } catch (error) {
      this.logger.debug('Token account not found or error getting balance', error);
      return 0;
    }
  }

  async getRecentBlockhash() {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();
      return blockhash;
    } catch (error) {
      this.logger.error('Failed to get recent blockhash', error);
      throw error;
    }
  }

  // Get market data from Jupiter or similar DEX aggregator
  async getTokenPrice(tokenMint) {
    try {
      // This is a placeholder - in a real implementation, you'd integrate with
      // Jupiter API, Raydium, or other DEX aggregators
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${tokenMint}`);
      const data = await response.json();
      
      if (data.data && data.data[tokenMint]) {
        return parseFloat(data.data[tokenMint].price);
      }
      
      return null;
    } catch (error) {
      this.logger.error('Failed to get token price', { tokenMint, error });
      return null;
    }
  }

  async simulateTransaction(transaction) {
    try {
      const simulation = await this.connection.simulateTransaction(transaction);
      return simulation;
    } catch (error) {
      this.logger.error('Failed to simulate transaction', error);
      throw error;
    }
  }
}

export default SolanaClient;