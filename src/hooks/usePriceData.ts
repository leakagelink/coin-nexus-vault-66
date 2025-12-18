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
  const [state, setState] = useState<{
    prices: Record<string, PriceData>;
    isLoading: boolean;
    error: string | null;
    updateCount: number;
  }>({
    prices: {},
    isLoading: true,
    error: null,
    updateCount: 0,
  });
  
  const intervalRef = useRef<number | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const symbolsKey = symbols.filter(Boolean).map(s => s.toUpperCase()).join(',');

  const fetchAllPrices = useCallback(async () => {
    const uniqueSymbols = [...new Set(symbols.filter(Boolean).map(s => s.toUpperCase()))];
    
    if (uniqueSymbols.length === 0) {
      setState(prev => ({ ...prev, isLoading: false }));
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
        setState(prev => ({
          ...prev,
          prices: newPrices,
          isLoading: false,
          error: null,
          updateCount: prev.updateCount + 1,
        }));
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load prices";
      console.error("Price fetch error:", e);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [symbolsKey]);

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
    return state.prices[symbol.toUpperCase()] || null;
  }, [state.prices]);

  return { 
    prices: state.prices, 
    isLoading: state.isLoading, 
    error: state.error,
    getPrice,
    refresh: fetchAllPrices,
    updateCount: state.updateCount
  };
}
