
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
  momentum?: number;
  bodySize?: number;
  upperShadow?: number;
  lowerShadow?: number;
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

  // Calculate RSI with proper momentum
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
        const recentChanges = changes.slice(i - period, i);
        const gains = recentChanges.filter(c => c > 0);
        const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
        
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

  // Calculate momentum and candle patterns
  private calculateMomentum(data: ChartData[]): ChartData[] {
    return data.map((candle, index) => {
      const bodySize = Math.abs(candle.close - candle.open);
      const totalRange = candle.high - candle.low;
      const upperShadow = candle.high - Math.max(candle.open, candle.close);
      const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
      
      // Calculate momentum based on body size and volume
      const momentum = totalRange > 0 ? (bodySize / totalRange) * (candle.volume / 1000000) : 0;
      
      return {
        ...candle,
        momentum,
        bodySize,
        upperShadow,
        lowerShadow
      };
    });
  }

  async getChartData(symbol: string, interval: string = '1h', limit: number = 200): Promise<ChartData[]> {
    try {
      console.log(`Fetching real Binance data for ${symbol} - ${interval}`);
      const response = await fetch(
        `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      // Convert Binance kline data to professional format
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

      // Add technical indicators and momentum
      const sma20 = this.calculateSMA(chartData, 20);
      const sma50 = this.calculateSMA(chartData, 50);
      const rsi = this.calculateRSI(chartData);
      const bb = this.calculateBollingerBands(chartData);

      const enrichedData = chartData.map((item, index) => {
        const enhanced: ChartData = { ...item };
        
        if (sma20[index] > 0) enhanced.sma20 = sma20[index];
        if (sma50[index] > 0) enhanced.sma50 = sma50[index];
        enhanced.rsi = rsi[index];
        
        if (bb.upper[index] > 0) {
          enhanced.bbUpper = bb.upper[index];
          enhanced.bbLower = bb.lower[index];
          enhanced.bbMiddle = bb.middle[index];
        }
        
        return enhanced;
      });

      return this.calculateMomentum(enrichedData);
      
    } catch (error) {
      console.error('Error fetching Binance chart data:', error);
      return this.generateRealisticMockData(symbol, interval, limit);
    }
  }

  private generateRealisticMockData(symbol: string, interval: string, limit: number): ChartData[] {
    const data: ChartData[] = [];
    const now = Date.now();
    const intervals: { [key: string]: number } = {
      '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000
    };
    const intervalMs = intervals[interval] || 3600000;
    
    const basePrices: { [key: string]: number } = {
      'BTCUSDT': 108000, 'ETHUSDT': 4400, 'BNBUSDT': 860, 
      'ADAUSDT': 0.83, 'SOLUSDT': 202, 'USDTUSDT': 1.0
    };
    
    let currentPrice = basePrices[symbol] || 100;
    
    for (let i = limit; i >= 0; i--) {
      const timestamp = now - (i * intervalMs);
      const date = new Date(timestamp);
      
      // Generate realistic price movement with momentum
      const volatility = symbol.includes('BTC') ? 0.015 : 0.025;
      const trend = Math.sin(i / 30) * 0.003;
      const momentum = (Math.random() - 0.5) * volatility;
      const noise = (Math.random() - 0.5) * 0.005;
      
      const open = currentPrice;
      const priceChange = trend + momentum + noise;
      const close = open * (1 + priceChange);
      
      // Create realistic wicks with momentum
      const bodySize = Math.abs(close - open);
      const wickIntensity = Math.random() * 2 + 0.5;
      const extraRange = bodySize * wickIntensity;
      
      const high = Math.max(open, close) + extraRange * Math.random();
      const low = Math.min(open, close) - extraRange * Math.random();
      
      // Volume with momentum correlation
      const volumeBase = 1000000 + Math.random() * 5000000;
      const volumeMomentum = Math.abs(priceChange) * 10000000;
      const volume = volumeBase + volumeMomentum;
      
      data.push({
        timestamp: Math.floor(timestamp / 1000),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        open: Math.max(open, 0.001),
        high: Math.max(high, 0.001),
        low: Math.max(low, 0.001),
        close: Math.max(close, 0.001),
        volume: volume
      });
      
      currentPrice = close;
    }
    
    // Add technical indicators and momentum
    const sma20 = this.calculateSMA(data, 20);
    const sma50 = this.calculateSMA(data, 50);
    const rsi = this.calculateRSI(data);
    const bb = this.calculateBollingerBands(data);

    const enrichedData = data.map((item, index) => {
      const enhanced: ChartData = { ...item };
      
      if (sma20[index] > 0) enhanced.sma20 = sma20[index];
      if (sma50[index] > 0) enhanced.sma50 = sma50[index];
      enhanced.rsi = rsi[index];
      
      if (bb.upper[index] > 0) {
        enhanced.bbUpper = bb.upper[index];
        enhanced.bbLower = bb.lower[index];
        enhanced.bbMiddle = bb.middle[index];
      }
      
      return enhanced;
    });

    return this.calculateMomentum(enrichedData);
  }
}

export const chartAPI = new ChartAPIService();
