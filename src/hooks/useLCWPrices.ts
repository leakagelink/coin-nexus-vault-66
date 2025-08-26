
import { useState, useEffect } from 'react';
import { liveCoinWatchService, LCWPrice } from '@/services/livecoinwatch';

export function useLCWPrices() {
  const [prices, setPrices] = useState<Record<string, LCWPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        const cryptoPrices = await liveCoinWatchService.getCryptoPrices();
        
        const pricesMap: Record<string, LCWPrice> = {};
        cryptoPrices.forEach((price) => {
          pricesMap[price.symbol] = price;
        });
        
        setPrices(pricesMap);
        setError(null);
      } catch (err) {
        setError('Failed to fetch prices from LiveCoinWatch');
        console.error('Error fetching LCW prices:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();

    // Refresh prices every 2 minutes (LiveCoinWatch allows more frequent calls)
    const interval = setInterval(fetchPrices, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getPrice = (symbol: string): LCWPrice | null => {
    return prices[symbol] || null;
  };

  return {
    prices,
    isLoading,
    error,
    getPrice
  };
}
