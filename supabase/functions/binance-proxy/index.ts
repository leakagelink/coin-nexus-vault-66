
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BINANCE_BASE_URL = "https://api.binance.com/api/v3";

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => null) as {
      endpoint?: string;
      symbol?: string;
      interval?: string;
      limit?: number;
    } | null;

    if (!body || !body.endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing 'endpoint' in request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { endpoint, symbol, interval = "1h", limit = 500 } = body;

    let url = "";
    if (endpoint === "klines") {
      if (!symbol) {
        return new Response(
          JSON.stringify({ error: "Missing 'symbol' for klines endpoint." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=500
      url = `${BINANCE_BASE_URL}/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${encodeURIComponent(String(limit))}`;
    } else if (endpoint === "ticker") {
      if (!symbol) {
        return new Response(
          JSON.stringify({ error: "Missing 'symbol' for ticker endpoint." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      url = `${BINANCE_BASE_URL}/ticker/24hr?symbol=${encodeURIComponent(symbol)}`;
    } else if (endpoint === "exchangeInfo") {
      url = `${BINANCE_BASE_URL}/exchangeInfo`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint. Use 'klines', 'ticker', or 'exchangeInfo'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[binance-proxy] Fetching:", url);

    // Public endpoints do NOT require API key
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error("[binance-proxy] Binance error:", response.status, text);
      return new Response(
        JSON.stringify({ error: `Binance API error: ${response.status} ${response.statusText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[binance-proxy] Unhandled error:", message);
    return new Response(JSON.stringify({ error: "Failed to fetch from Binance API", details: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
