
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

    console.log(`Fetching data for ${symbol} on ${exchange} with interval ${interval}`);

    // Fetch OHLCV candlestick data
    const candleResponse = await fetch(`https://api.taapi.io/candles?secret=${taapiKey}&exchange=${exchange}&symbol=${symbol}&interval=${interval}&period=${period}`);
    
    if (!candleResponse.ok) {
      throw new Error(`TaapiAPI error: ${candleResponse.status} ${candleResponse.statusText}`);
    }

    const candleData = await candleResponse.json();

    // Fetch technical indicators in parallel
    const indicatorPromises = indicators.map(async (indicator) => {
      try {
        const url = `https://api.taapi.io/${indicator}?secret=${taapiKey}&exchange=${exchange}&symbol=${symbol}&interval=${interval}&period=14`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return { indicator, data };
        }
        return { indicator, data: null };
      } catch (error) {
        console.error(`Error fetching ${indicator}:`, error);
        return { indicator, data: null };
      }
    });

    const indicatorResults = await Promise.all(indicatorPromises);
    const indicatorData = indicatorResults.reduce((acc, { indicator, data }) => {
      acc[indicator] = data;
      return acc;
    }, {} as Record<string, any>);

    return new Response(JSON.stringify({
      candles: candleData,
      indicators: indicatorData,
      symbol,
      exchange,
      interval
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TaapiAPI proxy error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      candles: [],
      indicators: {}
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
