
export interface BinancePrice {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
}

export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

class BinanceAPIService {
  private baseUrl = 'https://api.binance.com/api/v3';

  async getPrice(symbol: string): Promise<BinancePrice> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker/24hr?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BinanceTicker = await response.json();
      
      return {
        symbol: data.symbol,
        price: data.lastPrice,
        priceChange: data.priceChange,
        priceChangePercent: data.priceChangePercent
      };
    } catch (error) {
      console.error('Error fetching price from Binance:', error);
      throw error;
    }
  }

  async getPrices(symbols: string[]): Promise<BinancePrice[]> {
    try {
      const symbolsParam = symbols.map(s => `"${s}"`).join(',');
      const response = await fetch(`${this.baseUrl}/ticker/24hr?symbols=[${symbolsParam}]`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BinanceTicker[] = await response.json();
      
      return data.map(ticker => ({
        symbol: ticker.symbol,
        price: ticker.lastPrice,
        priceChange: ticker.priceChange,
        priceChangePercent: ticker.priceChangePercent
      }));
    } catch (error) {
      console.error('Error fetching prices from Binance:', error);
      throw error;
    }
  }

  // WebSocket connection for real-time prices
  subscribeToPrice(symbol: string, callback: (data: any) => void): WebSocket {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback({
        symbol: data.s,
        price: data.c,
        priceChange: data.P,
        priceChangePercent: data.p
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }
}

export const binanceAPI = new BinanceAPIService();
