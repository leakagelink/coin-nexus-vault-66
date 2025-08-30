
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

  async getKlines(symbol: string, interval: string, limit: number = 500): Promise<ProcessedCandle[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const data: BinanceKline[] = await response.json();
      return this.processCandles(data);
    } catch (error) {
      console.error('Error fetching Binance klines:', error);
      throw error;
    }
  }

  private processCandles(klines: BinanceKline[]): ProcessedCandle[] {
    return klines.map((kline) => {
      const open = parseFloat(kline.open);
      const high = parseFloat(kline.high);
      const low = parseFloat(kline.low);
      const close = parseFloat(kline.close);
      const volume = parseFloat(kline.volume);
      
      const bodySize = Math.abs(close - open);
      const totalRange = high - low;
      const upperShadow = high - Math.max(open, close);
      const lowerShadow = Math.min(open, close) - low;
      const isBullish = close >= open;
      
      // Calculate momentum based on body size, volume, and volatility
      const bodyToRangeRatio = totalRange > 0 ? bodySize / totalRange : 0;
      const volumeWeight = Math.log(volume + 1) / 20; // Normalize volume
      const momentum = (bodyToRangeRatio * volumeWeight) * 100;
      
      return {
        timestamp: kline.openTime,
        open,
        high,
        low,
        close,
        volume,
        momentum: Math.min(momentum, 100), // Cap at 100
        bodySize,
        upperShadow,
        lowerShadow,
        isBullish
      };
    });
  }

  async getCurrentPrice(symbol: string) {
    try {
      const response = await fetch(`${this.baseUrl}/ticker/24hr?symbol=${symbol}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching current price:', error);
      throw error;
    }
  }
}

export const binanceService = new BinanceService();
