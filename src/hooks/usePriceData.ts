import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCryptoPrices, CMCPrice } from "@/services/cmcProxy";

export type PriceData = {
  symbol: string;
  priceUSD: number;
  priceINR: number;
  change24h?: number;
  lastUpdate: number;
};

const USD_TO_INR = 84;
const CACHE_DURATION = 10000; // 10 seconds
const UPDATE_INTERVAL = 15000; // 15 seconds

/**
 * Centralized price data hook - uses CoinMarketCap API with key rotation
 */
export function usePriceData(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastFetchRef = useRef<number>(0);

  const uniqueSymbols = useMemo(() => 
    Array.from(new Set(symbols)).filter(Boolean).map(s => s.toUpperCase()), 
    [symbols]
  );

  const fetchAllPrices = useCallback(async () => {
    if (uniqueSymbols.length === 0) {
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    // Skip if recently fetched
    if (now - lastFetchRef.current < CACHE_DURATION && Object.keys(prices).length > 0) {
      return;
    }

    try {
      console.log("Fetching prices for:", uniqueSymbols);
      const cmcPrices = await getCryptoPrices(uniqueSymbols);
      
      const newPrices: Record<string, PriceData> = {};
      cmcPrices.forEach((p: CMCPrice) => {
        newPrices[p.symbol] = {
          symbol: p.symbol,
          priceUSD: p.price,
          priceINR: p.price * USD_TO_INR,
          change24h: p.percent_change_24h,
          lastUpdate: now,
        };
      });

      if (Object.keys(newPrices).length > 0) {
        setPrices(newPrices);
        lastFetchRef.current = now;
      }
      
      setError(null);
    } catch (e: any) {
      console.error("Price fetch error:", e);
      setError(e?.message || "Failed to load prices");
    } finally {
      setIsLoading(false);
    }
  }, [uniqueSymbols, prices]);

  useEffect(() => {
    fetchAllPrices();
    
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    intervalRef.current = window.setInterval(fetchAllPrices, UPDATE_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllPrices]);

  const getPrice = useCallback((symbol: string): PriceData | null => {
    return prices[symbol.toUpperCase()] || null;
  }, [prices]);

  return { 
    prices, 
    isLoading, 
    error,
    getPrice,
    refresh: fetchAllPrices
  };
}
