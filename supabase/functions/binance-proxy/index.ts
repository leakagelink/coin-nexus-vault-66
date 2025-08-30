
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, symbol, interval = '1h', limit = 500 } = await req.json()
    
    const BINANCE_API_KEY = 'eRSKz4nLGhEGj7bSGnxNVA5NLKxQQ8bN21whtTI32cilAugcL9OVVTO1sJ09mnk8'
    const BINANCE_BASE_URL = 'https://api.binance.com/api/v3'
    
    let url = ''
    const headers: Record<string, string> = {
      'X-MBX-APIKEY': BINANCE_API_KEY
    }
    
    if (endpoint === 'klines') {
      url = `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    } else if (endpoint === 'ticker') {
      url = `${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`
    } else if (endpoint === 'exchangeInfo') {
      url = `${BINANCE_BASE_URL}/exchangeInfo`
    } else {
      throw new Error('Invalid endpoint')
    }
    
    console.log(`Fetching from Binance: ${url}`)
    
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} - ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Binance proxy error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch from Binance API' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
```

Now I'll update the Binance service to use the proxy:

<lov-write file_path="src/services/binanceService.ts">
import { supabase } from '@/integrations/supabase/client';

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
  private async callBinanceProxy(endpoint: string, params: any = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('binance-proxy', {
        body: { endpoint, ...params }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Proxy error: ${error.message}`);
      }

      if (data.error) {
        console.error('Binance API error:', data.error);
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Binance service error:', error);
      throw error;
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 500): Promise<ProcessedCandle[]> {
    try {
      console.log(`Fetching Binance data for ${symbol} with ${interval} timeframe`);
      
      const data = await this.callBinanceProxy('klines', {
        symbol,
        interval,
        limit
      });
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format from Binance API');
      }
      
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
      return await this.callBinanceProxy('ticker', { symbol });
    } catch (error) {
      console.error('Error fetching current price:', error);
      throw error;
    }
  }

  async getExchangeInfo() {
    try {
      return await this.callBinanceProxy('exchangeInfo');
    } catch (error) {
      console.error('Error fetching exchange info:', error);
      throw error;
    }
  }
}

export const binanceService = new BinanceService();
