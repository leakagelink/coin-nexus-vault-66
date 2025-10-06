import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLatestTaapiPriceUSD } from "@/services/taapiProxy";

export type PriceData = {
  symbol: string;
  priceUSD: number;
  priceINR: number;
  lastUpdate: number;
};

const USD_TO_INR = 84;
const CACHE_DURATION = 5000; // 5 seconds
const UPDATE_INTERVAL = 5000; // 5 seconds

/**
 * Centralized price data hook - single source of truth for all prices
 * This prevents conflicts between different price hooks
 */
export function usePriceData(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastFetchRef = useRef<Record<string, number>>({});

  const uniqueSymbols = useMemo(() => 
    Array.from(new Set(symbols)).filter(Boolean), 
    [symbols]
  );

  const fetchPriceForSymbol = useCallback(async (symbol: string): Promise<PriceData | null> => {
    const now = Date.now();
    const lastFetch = lastFetchRef.current[symbol] || 0;
    
    // Return cached if still valid
    if (now - lastFetch < CACHE_DURATION && prices[symbol]) {
      return prices[symbol];
    }

    try {
      const usd = await getLatestTaapiPriceUSD(symbol, "1m");
      const priceData: PriceData = {
        symbol,
        priceUSD: usd,
        priceINR: usd * USD_TO_INR,
        lastUpdate: now,
      };
      
      lastFetchRef.current[symbol] = now;
      return priceData;
    } catch (e) {
      console.error(`Failed to fetch price for ${symbol}:`, e);
      return null;
    }
  }, [prices]);

  const fetchAllPrices = useCallback(async () => {
    if (uniqueSymbols.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const results = await Promise.all(
        uniqueSymbols.map(sym => fetchPriceForSymbol(sym))
      );

      const newPrices: Record<string, PriceData> = { ...prices };
      results.forEach((result) => {
        if (result) {
          newPrices[result.symbol] = result;
        }
      });

      if (Object.keys(newPrices).length > 0) {
        setPrices(newPrices);
      }
      
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load prices");
      console.error("Price fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [uniqueSymbols, fetchPriceForSymbol, prices]);

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
    return prices[symbol] || null;
  }, [prices]);

  return { 
    prices, 
    isLoading, 
    error,
    getPrice,
    refresh: fetchAllPrices
  };
}
