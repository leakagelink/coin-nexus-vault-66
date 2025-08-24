
import { useState, useEffect, useRef } from 'react';
import { binanceAPI, BinancePrice } from '@/services/binanceApi';

export interface LivePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'USDTINR'];

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const websockets = useRef<Record<string, WebSocket>>({});

  useEffect(() => {
    const initializePrices = async () => {
      try {
        setIsLoading(true);
        const binancePrices = await binanceAPI.getPrices(CRYPTO_SYMBOLS);
        
        const pricesMap: Record<string, LivePrice> = {};
        binancePrices.forEach((price) => {
          pricesMap[price.symbol] = {
            symbol: price.symbol,
            price: parseFloat(price.price),
            change: parseFloat(price.priceChange),
            changePercent: parseFloat(price.priceChangePercent)
          };
        });
        
        setPrices(pricesMap);
        setError(null);
      } catch (err) {
        setError('Failed to fetch prices from Binance');
        console.error('Error initializing prices:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializePrices();

    // Setup WebSocket connections for real-time updates
    CRYPTO_SYMBOLS.forEach((symbol) => {
      const ws = binanceAPI.subscribeToPrice(symbol, (data) => {
        setPrices(prev => ({
          ...prev,
          [data.symbol]: {
            symbol: data.symbol,
            price: parseFloat(data.price),
            change: parseFloat(data.priceChange),
            changePercent: parseFloat(data.priceChangePercent)
          }
        }));
      });
      
      websockets.current[symbol] = ws;
    });

    return () => {
      // Cleanup WebSocket connections
      Object.values(websockets.current).forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      websockets.current = {};
    };
  }, []);

  const getPrice = (symbol: string): LivePrice | null => {
    return prices[symbol] || null;
  };

  return {
    prices,
    isLoading,
    error,
    getPrice
  };
}
