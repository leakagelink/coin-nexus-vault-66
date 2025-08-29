
import { useState, useEffect } from 'react';
import { getCryptoPrices, DEFAULT_SYMBOLS, type CMCPrice } from '@/services/cmcProxy';

export function useCMCPrices(symbols: string[] = DEFAULT_SYMBOLS) {
  const [prices, setPrices] = useState<Record<string, CMCPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        const cryptoPrices = await getCryptoPrices(symbols);

        if (!isActive) return;

        const pricesMap: Record<string, CMCPrice> = {};
        cryptoPrices.forEach((price) => {
          pricesMap[price.symbol] = price;
        });

        setPrices(pricesMap);
        setError(null);
      } catch (err) {
        setError('Failed to fetch prices');
        console.error('Error fetching prices via cmc-proxy:', err);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchPrices();

    // Refresh prices every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [symbols.join(',')]);

  const getPrice = (symbol: string): CMCPrice | null => {
    return prices[symbol] || null;
  };

  return {
    prices,
    isLoading,
    error,
    getPrice
  };
}
