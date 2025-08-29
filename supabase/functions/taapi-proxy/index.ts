
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaapiRequest {
  symbol: string;
  exchange: string;
  interval: string;
  period?: number;
  indicators?: string[];
}

// Cache to store recent requests and avoid rate limiting
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, exchange = 'binance', interval = '1h', period = 100, indicators = [] }: TaapiRequest = await req.json();
    
    const taapiKey = Deno.env.get('TAAPI_API_KEY');
    if (!taapiKey) {
      throw new Error('TaapiAPI key not configured');
    }

    // Create cache key
    const cacheKey = `${symbol}-${exchange}-${interval}-${period}-${indicators.join(',')}`;
    const now = Date.now();
    
    // Check cache first
    const cached = requestCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`Returning cached data for ${symbol}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching fresh data for ${symbol} on ${exchange} with interval ${interval}`);

    // Add a small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch OHLCV candlestick data
    const candleResponse = await fetch(`https://api.taapi.io/candles?secret=${taapiKey}&exchange=${exchange}&symbol=${symbol}&interval=${interval}&period=${period}`);
    
    if (!candleResponse.ok) {
      if (candleResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again.');
      }
      throw new Error(`TaapiAPI error: ${candleResponse.status} ${candleResponse.statusText}`);
    }

    const candleData = await candleResponse.json();

    if (!Array.isArray(candleData) || candleData.length === 0) {
      throw new Error('No candle data received from TaapiAPI');
    }

    // Fetch technical indicators with delays between requests
    const indicatorData: Record<string, any> = {};
    
    for (const indicator of indicators) {
      try {
        // Add delay between indicator requests
        await new Promise(resolve => setTimeout(resolve, 300));
        
        let url = `https://api.taapi.io/${indicator}?secret=${taapiKey}&exchange=${exchange}&symbol=${symbol}&interval=${interval}`;
        
        // Add specific parameters for different indicators
        if (indicator === 'sma') {
          url += '&period=20';
        } else if (indicator === 'rsi') {
          url += '&period=14';
        } else if (indicator === 'macd') {
          url += '&fastperiod=12&slowperiod=26&signalperiod=9';
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          indicatorData[indicator] = Array.isArray(data) ? data : [data];
        } else {
          console.error(`Error fetching ${indicator}: ${response.status}`);
          indicatorData[indicator] = null;
        }
      } catch (error) {
        console.error(`Error fetching ${indicator}:`, error);
        indicatorData[indicator] = null;
      }
    }

    const result = {
      candles: candleData,
      indicators: indicatorData,
      symbol,
      exchange,
      interval,
      timestamp: now
    };

    // Cache the result
    requestCache.set(cacheKey, { data: result, timestamp: now });
    
    // Clean old cache entries
    for (const [key, value] of requestCache.entries()) {
      if ((now - value.timestamp) > CACHE_DURATION * 2) {
        requestCache.delete(key);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TaapiAPI proxy error:', error);
    
    // Return a more user-friendly error response
    const errorResponse = {
      error: error.message,
      candles: [],
      indicators: {},
      fallback: true
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: error.message.includes('Rate limit') ? 429 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
