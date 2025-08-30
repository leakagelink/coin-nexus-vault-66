
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LivePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high24h?: number;
  low24h?: number;
  lastUpdate: number;
  trend: 'up' | 'down' | 'neutral';
  momentum: number;
}

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'USDT', 'XRP', 'DOT', 'LINK', 'LTC', 'DOGE', 'TRX', 'TON', 'MATIC', 'BCH', 'AVAX'];

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const priceHistoryRef = useRef<Record<string, number[]>>({});

  const generateRealisticPrice = (basePrice: number, symbol: string, index: number) => {
    const now = Date.now();
    const timeBasedVariation = Math.sin(now / 20000 + index) * 0.015; // 20 second cycles for faster updates
    const randomWalk = (Math.random() - 0.5) * 0.008; // Random variation
    const volatility = symbol === 'BTC' ? 0.003 : symbol === 'ETH' ? 0.005 : 0.008;
    
    // Get price history for momentum calculation
    if (!priceHistoryRef.current[symbol]) {
      priceHistoryRef.current[symbol] = [];
    }
    
    const history = priceHistoryRef.current[symbol];
    const variation = timeBasedVariation + randomWalk;
    const newPrice = basePrice * (1 + variation * volatility);
    
    // Keep last 10 prices for trend calculation
    history.push(newPrice);
    if (history.length > 15) {
      history.shift();
    }
    
    return newPrice;
  };

  const calculateMomentum = (symbol: string, currentPrice: number) => {
    const history = priceHistoryRef.current[symbol] || [];
    if (history.length < 3) return 0;
    
    const recentPrices = history.slice(-8);
    const trend = recentPrices.reduce((acc, price, idx) => {
      if (idx === 0) return acc;
      return acc + (price - recentPrices[idx - 1]);
    }, 0);
    
    return (trend / currentPrice) * 2000; // Enhanced momentum calculation
  };

  const fetchPrices = async () => {
    try {
      console.log('Fetching live prices with enhanced frequency...');
      const { data, error: supabaseError } = await supabase.functions.invoke('cmc-proxy', {
        body: { symbols: CRYPTO_SYMBOLS }
      });

      if (supabaseError) {
        throw new Error('Failed to fetch live prices');
      }

      if (data && Array.isArray(data)) {
        const pricesMap: Record<string, LivePrice> = {};
        data.forEach((crypto: any, index: number) => {
          const basePrice = crypto.price;
          const livePrice = generateRealisticPrice(basePrice, crypto.symbol, index);
          const momentum = calculateMomentum(crypto.symbol, livePrice);
          const changePercent = ((livePrice - basePrice) / basePrice) * 100;
          
          pricesMap[crypto.symbol] = {
            symbol: crypto.symbol,
            price: livePrice,
            change: livePrice - basePrice,
            changePercent,
            volume: crypto.market_cap ? crypto.market_cap / livePrice : Math.random() * 2000000 + 500000,
            high24h: livePrice * (1 + Math.abs(changePercent) / 100 * 1.2),
            low24h: livePrice * (1 - Math.abs(changePercent) / 100 * 1.2),
            lastUpdate: Date.now(),
            trend: changePercent > 0.05 ? 'up' : changePercent < -0.05 ? 'down' : 'neutral',
            momentum: Math.abs(momentum)
          };
        });
        
        setPrices(pricesMap);
        setError(null);
        console.log('Live prices updated with enhanced momentum:', Object.keys(pricesMap).length, 'symbols');
      }
    } catch (err) {
      console.error('Error fetching live prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      
      // Enhanced mock data with better price simulation
      const mockPrices: Record<string, LivePrice> = {};
      const basePrices = [95000, 3500, 650, 0.45, 180, 1.0, 0.62, 7.8, 15.2, 105, 0.08, 0.11, 5.4, 0.95, 320, 42];
      
      CRYPTO_SYMBOLS.forEach((symbol, index) => {
        const basePrice = basePrices[index] || 100;
        const livePrice = generateRealisticPrice(basePrice, symbol, index);
        const momentum = calculateMomentum(symbol, livePrice);
        const changePercent = ((livePrice - basePrice) / basePrice) * 100;
        
        mockPrices[symbol] = {
          symbol,
          price: livePrice,
          change: livePrice - basePrice,
          changePercent,
          volume: Math.random() * 2000000 + 500000,
          high24h: livePrice * 1.08,
          low24h: livePrice * 0.92,
          lastUpdate: Date.now(),
          trend: changePercent > 0.05 ? 'up' : changePercent < -0.05 ? 'down' : 'neutral',
          momentum: Math.abs(momentum)
        };
      });
      setPrices(mockPrices);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Set up interval for faster live updates every 3 seconds
    intervalRef.current = setInterval(fetchPrices, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getPrice = (symbol: string): LivePrice | null => {
    return prices[symbol] || null;
  };

  const getTrendingPairs = () => {
    return Object.values(prices)
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, 6);
  };

  const computedLastUpdate = Object.keys(prices).length
    ? Math.max(...Object.values(prices).map((p) => p.lastUpdate || 0))
    : 0;

  return {
    prices,
    isLoading,
    error,
    getPrice,
    getTrendingPairs,
    lastUpdate: computedLastUpdate,
  };
}
