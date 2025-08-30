
export interface ChartData {
  timestamp: number;
  date: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
}

class ChartAPIService {
  private baseUrl = 'https://api.binance.com/api/v3';

  // Calculate Simple Moving Average
  private calculateSMA(data: ChartData[], period: number): number[] {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(0);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  }

  // Calculate RSI
  private calculateRSI(data: ChartData[], period: number = 14): number[] {
    const rsi = [];
    const changes = [];
    
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].close - data[i - 1].close);
    }
    
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        rsi.push(50);
      } else {
        const gains = changes.slice(i - period, i).filter(c => c > 0);
        const losses = changes.slice(i - period, i).filter(c => c < 0).map(c => Math.abs(c));
        
        const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / period : 0;
        const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / period : 0;
        
        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }
    return rsi;
  }

  // Calculate Bollinger Bands
  private calculateBollingerBands(data: ChartData[], period: number = 20, multiplier: number = 2) {
    const sma = this.calculateSMA(data, period);
    const upper = [];
    const lower = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(0);
        lower.push(0);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((acc, item) => acc + Math.pow(item.close - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        
        upper.push(mean + (multiplier * stdDev));
        lower.push(mean - (multiplier * stdDev));
      }
    }
    
    return { upper, lower, middle: sma };
  }

  async getChartData(symbol: string, interval: string = '1h', limit: number = 100): Promise<ChartData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      // Convert Binance kline data to our format
      const chartData: ChartData[] = rawData.map((kline: any[]) => {
        const timestamp = kline[0];
        const date = new Date(timestamp);
        
        return {
          timestamp: Math.floor(timestamp / 1000),
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5])
        };
      });

      // Add technical indicators
      const sma20 = this.calculateSMA(chartData, 20);
      const sma50 = this.calculateSMA(chartData, 50);
      const rsi = this.calculateRSI(chartData);
      const bb = this.calculateBollingerBands(chartData);

      chartData.forEach((item, index) => {
        if (sma20[index] > 0) item.sma20 = sma20[index];
        if (sma50[index] > 0) item.sma50 = sma50[index];
        item.rsi = rsi[index];
        if (bb.upper[index] > 0) {
          item.bbUpper = bb.upper[index];
          item.bbLower = bb.lower[index];
          item.bbMiddle = bb.middle[index];
        }
      });

      return chartData;
      
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Return mock data on error
      return this.generateMockData(symbol, interval, limit);
    }
  }

  private generateMockData(symbol: string, interval: string, limit: number): ChartData[] {
    const data: ChartData[] = [];
    const now = Date.now();
    const intervals: { [key: string]: number } = {
      '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000
    };
    const intervalMs = intervals[interval] || 3600000;
    
    // Base prices for different symbols
    const basePrices: { [key: string]: number } = {
      'BTCUSDT': 95000, 'ETHUSDT': 3500, 'BNBUSDT': 650, 
      'ADAUSDT': 0.45, 'SOLUSDT': 180, 'USDTUSDT': 1.0
    };
    
    let currentPrice = basePrices[symbol] || 100;
    
    for (let i = limit; i >= 0; i--) {
      const timestamp = now - (i * intervalMs);
      const date = new Date(timestamp);
      
      // Generate realistic price movement with momentum
      const volatility = symbol.includes('BTC') ? 0.02 : 0.03;
      const trend = Math.sin(i / 20) * 0.005; // Trending component
      const momentum = (Math.random() - 0.5) * volatility;
      
      const open = currentPrice;
      const priceChange = trend + momentum;
      const close = open * (1 + priceChange);
      
      // Create realistic high and low with proper wicks
      const bodyRange = Math.abs(close - open);
      const wickMultiplier = 0.5 + Math.random() * 2;
      const extraRange = bodyRange * wickMultiplier;
      
      const high = Math.max(open, close) + extraRange * Math.random();
      const low = Math.min(open, close) - extraRange * Math.random();
      
      data.push({
        timestamp: Math.floor(timestamp / 1000),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        open: Math.max(open, 0.001),
        high: Math.max(high, 0.001),
        low: Math.max(low, 0.001),
        close: Math.max(close, 0.001),
        volume: Math.random() * 10000000 + 1000000
      });
      
      currentPrice = close;
    }
    
    // Add technical indicators
    const sma20 = this.calculateSMA(data, 20);
    const sma50 = this.calculateSMA(data, 50);
    const rsi = this.calculateRSI(data);
    const bb = this.calculateBollingerBands(data);

    data.forEach((item, index) => {
      if (sma20[index] > 0) item.sma20 = sma20[index];
      if (sma50[index] > 0) item.sma50 = sma50[index];
      item.rsi = rsi[index];
      if (bb.upper[index] > 0) {
        item.bbUpper = bb.upper[index];
        item.bbLower = bb.lower[index];
        item.bbMiddle = bb.middle[index];
      }
    });
    
    return data;
  }
}

export const chartAPI = new ChartAPIService();
