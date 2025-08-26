
import { useState, useEffect } from 'react';
import { coinMarketCapService, CMCPrice } from '@/services/coinmarketcap';

export function useCMCPrices() {
  const [prices, setPrices] = useState<Record<string, CMCPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        const cryptoPrices = await coinMarketCapService.getCryptoPrices();
        
        const pricesMap: Record<string, CMCPrice> = {};
        cryptoPrices.forEach((price) => {
          pricesMap[price.symbol] = price;
        });
        
        setPrices(pricesMap);
        setError(null);
      } catch (err) {
        setError('Failed to fetch prices from CoinMarketCap');
        console.error('Error fetching CMC prices:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();

    // Refresh prices every 5 minutes (CoinMarketCap rate limit consideration)
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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
