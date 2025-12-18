import { useCallback, useEffect, useRef, useState } from "react";

export type WebSocketPriceData = {
  symbol: string;
  priceUSD: number;
  priceINR: number;
  change24h: number;
  lastUpdate: number;
};

const USD_TO_INR = 84;
const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws";
const BINANCE_API_URL = "https://api.binance.com/api/v3/ticker/24hr";
const FALLBACK_INTERVAL = 3000; // 3 second polling fallback

/**
 * WebSocket-based price data hook using Binance real-time streams
 * Falls back to Binance REST API polling if WebSocket fails (no CMC rate limits)
 */
export function useBinanceWebSocket(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, WebSocketPriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [connectionMode, setConnectionMode] = useState<'connecting' | 'websocket' | 'polling'>('connecting');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);
  const connectionAttempts = useRef(0);
  const symbolsKey = symbols.filter(Boolean).map(s => s.toLowerCase()).join(',');

  // Fallback polling using Binance REST API (free, high rate limits)
  const fetchPricesViaAPI = useCallback(async () => {
    const uniqueSymbols = [...new Set(symbols.filter(Boolean).map(s => s.toUpperCase()))];
    if (uniqueSymbols.length === 0) return;

    try {
      // Fetch all tickers from Binance API
      const response = await fetch(BINANCE_API_URL);
      if (!response.ok) throw new Error('Binance API error');
      
      const allTickers = await response.json();
      const now = Date.now();
      
      const newPrices: Record<string, WebSocketPriceData> = {};
      
      uniqueSymbols.forEach(symbol => {
        const ticker = allTickers.find((t: any) => t.symbol === `${symbol}USDT`);
        if (ticker) {
          const priceUSD = parseFloat(ticker.lastPrice);
          const change24h = parseFloat(ticker.priceChangePercent);
          newPrices[symbol] = {
            symbol,
            priceUSD,
            priceINR: priceUSD * USD_TO_INR,
            change24h,
            lastUpdate: now,
          };
        }
      });

      if (Object.keys(newPrices).length > 0) {
        setPrices(newPrices);
        setUpdateCount(c => c + 1);
        setIsConnected(true);
        setError(null);
      }
    } catch (e) {
      console.error("Binance API fallback error:", e);
    }
  }, [symbols]);

  // Start fallback polling
  const startFallbackPolling = useCallback(() => {
    console.log("Starting fallback polling mode");
    setConnectionMode('polling');
    
    // Clear any existing interval
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }
    
    // Initial fetch
    fetchPricesViaAPI();
    
    // Set up polling interval
    fallbackIntervalRef.current = window.setInterval(fetchPricesViaAPI, FALLBACK_INTERVAL);
  }, [fetchPricesViaAPI]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const uniqueSymbols = [...new Set(symbols.filter(Boolean).map(s => s.toLowerCase()))];
    if (uniqueSymbols.length === 0) return;

    // Create combined stream for all symbols
    const streams = uniqueSymbols.map(s => `${s}usdt@miniTicker`).join('/');
    const wsUrl = `${BINANCE_WS_URL}/${streams}`;

    console.log('Attempting Binance WebSocket connection:', wsUrl);
    setConnectionMode('connecting');
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout, falling back to polling');
          ws.close();
          startFallbackPolling();
        }
      }, 5000);

      ws.onopen = () => {
        console.log('Binance WebSocket connected successfully!');
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setConnectionMode('websocket');
        setError(null);
        connectionAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.e === '24hrMiniTicker') {
            const symbol = data.s.replace('USDT', '');
            const priceUSD = parseFloat(data.c);
            const openPrice = parseFloat(data.o);
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
        clearTimeout(connectionTimeout);
        connectionAttempts.current++;
        
        if (connectionAttempts.current >= 2) {
          console.log('WebSocket failed multiple times, switching to polling');
          startFallbackPolling();
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        wsRef.current = null;
        
        // If already in polling mode, don't try to reconnect WebSocket
        if (connectionMode === 'polling') return;
        
        // Try to reconnect WebSocket after delay
        if (connectionAttempts.current < 2) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log('Attempting WebSocket reconnection...');
            connectWebSocket();
          }, 3000);
        } else {
          startFallbackPolling();
        }
      };

    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      startFallbackPolling();
    }
  }, [symbolsKey, startFallbackPolling]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connectionAttempts.current = 0;
    setConnectionMode('connecting');
    connectWebSocket();
  }, [disconnect, connectWebSocket]);

  useEffect(() => {
    connectWebSocket();
    return () => disconnect();
  }, [connectWebSocket, disconnect]);

  const getPrice = useCallback((symbol: string): WebSocketPriceData | null => {
    return prices[symbol.toUpperCase()] || null;
  }, [prices]);

  return { 
    prices, 
    isConnected, 
    error,
    getPrice,
    reconnect,
    updateCount,
    connectionMode
  };
}
