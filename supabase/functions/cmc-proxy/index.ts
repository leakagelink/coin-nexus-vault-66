
/**
 * Supabase Edge Function: cmc-proxy
 * Proxies CoinMarketCap API using secret CMC_API_KEY (set in Supabase Functions secrets).
 * Supports GET ?symbols=BTC,ETH and POST { symbols: ["BTC", "ETH"] }.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type CMCPrice = {
  symbol: string;
  name: string;
  price: number;
  percent_change_24h: number;
  market_cap?: number;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const DEFAULT_SYMBOLS = [
  "BTC",
  "ETH",
  "BNB",
  "SOL",
  "XRP",
  "ADA",
  "DOGE",
  "TRX",
  "TON",
  "MATIC",
  "LTC",
  "DOT",
  "BCH",
  "LINK",
  "AVAX",
];

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get symbols from GET param or POST body
    let symbols = DEFAULT_SYMBOLS;
    if (req.method === "GET") {
      const url = new URL(req.url);
      const s = url.searchParams.get("symbols");
      if (s) {
        symbols = s
          .split(",")
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean);
      }
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (Array.isArray(body?.symbols)) {
        symbols = body.symbols.map((x: string) => String(x).toUpperCase());
      }
    }

    const apiKey = Deno.env.get("CMC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing CMC_API_KEY secret in Edge Function" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const endpoint = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(
      symbols.join(",")
    )}&convert=USD`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-CMC_PRO_API_KEY": apiKey,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: "CMC request failed", details: text }),
        { status: res.status, headers: jsonHeaders }
      );
    }

    const json = await res.json();
    const raw = json?.data || {};

    const out: CMCPrice[] = Object.keys(raw).map((sym) => {
      const item = raw[sym];
      const quote = item?.quote?.USD || {};
      return {
        symbol: item?.symbol,
        name: item?.name,
        price: Number(quote?.price ?? 0),
        percent_change_24h: Number(quote?.percent_change_24h ?? 0),
        market_cap: quote?.market_cap != null ? Number(quote.market_cap) : undefined,
      };
    });

    return new Response(JSON.stringify(out), { status: 200, headers: jsonHeaders });
  } catch (e) {
    console.error("cmc-proxy error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error", message: e?.message || String(e) }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
