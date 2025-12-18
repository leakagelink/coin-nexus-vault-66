import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCryptoPrices, CMCPrice } from "@/services/cmcProxy";

export type PriceData = {
  symbol: string;
  priceUSD: number;
  priceINR: number;
  change24h: number;
  lastUpdate: number;
};

const USD_TO_INR = 84;
const UPDATE_INTERVAL = 5000; // 5 seconds - faster updates for realtime feel

/**
 * Centralized price data hook - uses CoinMarketCap API with key rotation
 */
export function usePriceData(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const uniqueSymbols = useMemo(() => 
    Array.from(new Set(symbols)).filter(Boolean).map(s => s.toUpperCase()), 
    [symbols]
  );

  const fetchAllPrices = useCallback(async () => {
    if (uniqueSymbols.length === 0) {
      setIsLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const cmcPrices = await getCryptoPrices(uniqueSymbols);
      const now = Date.now();
      
      const newPrices: Record<string, PriceData> = {};
      cmcPrices.forEach((p: CMCPrice) => {
        newPrices[p.symbol] = {
          symbol: p.symbol,
          priceUSD: p.price,
          priceINR: p.price * USD_TO_INR,
          change24h: p.percent_change_24h || 0,
          lastUpdate: now,
        };
      });

      if (Object.keys(newPrices).length > 0) {
        setPrices(newPrices);
      }
      
      setError(null);
    } catch (e: any) {
      console.error("Price fetch error:", e);
      setError(e?.message || "Failed to load prices");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [uniqueSymbols]);

  useEffect(() => {
    // Initial fetch
    fetchAllPrices();
    
    // Clear existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    // Set up polling for realtime updates
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
