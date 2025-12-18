import { useCallback, useEffect, useRef, useState } from "react";
import { getCryptoPrices, CMCPrice } from "@/services/cmcProxy";

export type PriceData = {
  symbol: string;
  priceUSD: number;
  priceINR: number;
  change24h: number;
  lastUpdate: number;
};

const USD_TO_INR = 84;
const UPDATE_INTERVAL = 3000; // 3 seconds for realtime feel

/**
 * Centralized price data hook - uses CoinMarketCap API with key rotation
 * Updates every 3 seconds for realtime momentum display
 */
export function usePriceData(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0); // Force re-render
  const intervalRef = useRef<number | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const symbolsRef = useRef<string[]>([]);
  
  // Store symbols in ref
  symbolsRef.current = symbols.filter(Boolean).map(s => s.toUpperCase());

  const fetchAllPrices = useCallback(async () => {
    const uniqueSymbols = [...new Set(symbolsRef.current)];
    
    if (uniqueSymbols.length === 0) {
      setIsLoading(false);
      return;
    }

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
        setUpdateCount(c => c + 1); // Force re-render
      }
      
      setError(null);
    } catch (e: any) {
      console.error("Price fetch error:", e);
      setError(e?.message || "Failed to load prices");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial fetch immediately
    fetchAllPrices();
    
    // Clear existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    // Set up polling for realtime updates every 3 seconds
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
    refresh: fetchAllPrices,
    updateCount // Expose update count for UI reactivity
  };
}
