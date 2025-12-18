import { useCallback, useEffect, useRef, useState } from "react";

export type WebSocketPriceData = {
  symbol: string;
  priceUSD: number;
  priceINR: number;
  change24h: number;
  lastUpdate: number;
};

const USD_TO_INR = 84;

// Binance WebSocket streams for real-time prices
const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws";

/**
 * WebSocket-based price data hook using Binance real-time streams
 * Provides instant price updates without polling
 */
export function useBinanceWebSocket(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, WebSocketPriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const symbolsKey = symbols.filter(Boolean).map(s => s.toLowerCase()).join(',');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const uniqueSymbols = [...new Set(symbols.filter(Boolean).map(s => s.toLowerCase()))];
    if (uniqueSymbols.length === 0) return;

    // Create combined stream for all symbols (miniTicker gives us price + 24h change)
    const streams = uniqueSymbols.map(s => `${s}usdt@miniTicker`).join('/');
    const wsUrl = `${BINANCE_WS_URL}/${streams}`;

    console.log('Connecting to Binance WebSocket:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Binance WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle miniTicker data
          if (data.e === '24hrMiniTicker') {
            const symbol = data.s.replace('USDT', ''); // Remove USDT suffix
            const priceUSD = parseFloat(data.c); // Current price
            const openPrice = parseFloat(data.o); // Open price 24h ago
            const change24h = openPrice > 0 ? ((priceUSD - openPrice) / openPrice) * 100 : 0;
            
            setPrices(prev => ({
              ...prev,
              [symbol]: {
                symbol,
                priceUSD,
                priceINR: priceUSD * USD_TO_INR,
                change24h,
                lastUpdate: Date.now(),
              }
            }));
            setUpdateCount(c => c + 1);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setError('Failed to connect to price stream');
    }
  }, [symbolsKey]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const getPrice = useCallback((symbol: string): WebSocketPriceData | null => {
    return prices[symbol.toUpperCase()] || null;
  }, [prices]);

  return { 
    prices, 
    isConnected, 
    error,
    getPrice,
    reconnect: connect,
    updateCount
  };
}
