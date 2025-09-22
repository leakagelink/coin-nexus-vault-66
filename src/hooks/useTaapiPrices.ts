
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLatestTaapiPriceUSD } from "@/services/taapiProxy";

export type TaapiPrice = {
  symbol: string;
  priceUSD: number;
  priceINR: number;
  lastUpdate: number;
};

const USD_TO_INR = 84;

export function useTaapiPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, TaapiPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const uniqueSymbols = useMemo(() => Array.from(new Set(symbols)).filter(Boolean), [symbols]);

  const fetchAll = useCallback(async () => {
    if (uniqueSymbols.length === 0) return;
    try {
      const now = Date.now();
      const results = await Promise.all(
        uniqueSymbols.map(async (sym) => {
          try {
            const usd = await getLatestTaapiPriceUSD(sym, "1m");
            return {
              symbol: sym,
              priceUSD: usd,
              priceINR: usd * USD_TO_INR,
              lastUpdate: now,
            } as TaapiPrice;
          } catch (e) {
            return null;
          }
        })
      );

      const map: Record<string, TaapiPrice> = {};
      results.forEach((r) => {
        if (r) map[r.symbol] = r;
      });
      if (Object.keys(map).length > 0) {
        setPrices(map);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load TAAPI prices");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [uniqueSymbols]);

  useEffect(() => {
    fetchAll();
    // refresh every 5s
    intervalRef.current = window.setInterval(fetchAll, 5000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  return { prices, isLoading, error };
}
