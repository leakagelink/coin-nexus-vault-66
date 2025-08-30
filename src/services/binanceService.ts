
export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface ProcessedCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  momentum: number;
  bodySize: number;
  upperShadow: number;
  lowerShadow: number;
  isBullish: boolean;
}

class BinanceService {
  private baseUrl = 'https://api.binance.com/api/v3';
  private apiKey = 'eRSKz4nLGhEGj7bSGnxNVA5NLKxQQ8bN21whtTI32cilAugcL9OVVTO1sJ09mnk8';

  async getKlines(symbol: string, interval: string, limit: number = 500): Promise<ProcessedCandle[]> {
    try {
      const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      console.log(`Fetching Binance data from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} - ${response.statusText}`);
      }
      
      const data: any[][] = await response.json();
      console.log(`Received ${data.length} candles from Binance`);
      
      return this.processCandles(data);
    } catch (error) {
      console.error('Error fetching Binance klines:', error);
      throw error;
    }
  }

  private processCandles(klines: any[][]): ProcessedCandle[] {
    return klines.map((kline) => {
      const open = parseFloat(kline[1]);
      const high = parseFloat(kline[2]);
      const low = parseFloat(kline[3]);
      const close = parseFloat(kline[4]);
      const volume = parseFloat(kline[5]);
      
      const bodySize = Math.abs(close - open);
      const totalRange = high - low;
      const upperShadow = high - Math.max(open, close);
      const lowerShadow = Math.min(open, close) - low;
      const isBullish = close >= open;
      
      // Enhanced momentum calculation
      const bodyToRangeRatio = totalRange > 0 ? bodySize / totalRange : 0;
      const volumeWeight = Math.log(volume + 1) / 20;
      const priceImpact = bodySize / Math.max(open, close);
      const momentum = (bodyToRangeRatio * volumeWeight * priceImpact) * 100;
      
      return {
        timestamp: parseInt(kline[0]),
        open,
        high,
        low,
        close,
        volume,
        momentum: Math.min(momentum, 100),
        bodySize,
        upperShadow,
        lowerShadow,
        isBullish
      };
    });
  }

  async getCurrentPrice(symbol: string) {
    try {
      const response = await fetch(`${this.baseUrl}/ticker/24hr?symbol=${symbol}`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching current price:', error);
      throw error;
    }
  }

  async getExchangeInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/exchangeInfo`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching exchange info:', error);
      throw error;
    }
  }
}

export const binanceService = new BinanceService();
