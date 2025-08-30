import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { binanceService, ProcessedCandle } from '@/services/binanceService';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface BinanceChartProps {
  symbol: string;
  name: string;
  onClose?: () => void;
  isFullPage?: boolean;
}

export function BinanceChart({ symbol, name, onClose, isFullPage = false }: BinanceChartProps) {
  const [candles, setCandles] = useState<ProcessedCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState('1h');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanX, setLastPanX] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const panTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch candle data
  const fetchData = useCallback(async () => {
    if (!symbol) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`[BinanceChart] Fetching ${symbol} data...`);
      
      const data = await binanceService.getKlines(symbol, interval, 100);
      setCandles(data);
      console.log(`[BinanceChart] Loaded ${data.length} candles for ${symbol}`);
    } catch (err) {
      console.error('[BinanceChart] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  // Initial load and auto-refresh setup
  useEffect(() => {
    fetchData();
    
    if (isAutoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData();
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchData, isAutoRefresh]);

  // Stop auto-refresh when user interacts
  const pauseAutoRefresh = useCallback(() => {
    setIsAutoRefresh(false);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Resume after 10 seconds of inactivity
    if (panTimeoutRef.current) {
      clearTimeout(panTimeoutRef.current);
    }
    panTimeoutRef.current = setTimeout(() => {
      setIsAutoRefresh(true);
    }, 10000);
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
    pauseAutoRefresh();
  }, [pauseAutoRefresh]);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
    pauseAutoRefresh();
  }, [pauseAutoRefresh]);

  // Mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setLastPanX(e.clientX);
    pauseAutoRefresh();
  }, [pauseAutoRefresh]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastPanX;
    setPanOffset(prev => prev + deltaX / zoomLevel);
    setLastPanX(e.clientX);
  }, [isPanning, lastPanX, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    pauseAutoRefresh();
  }, [pauseAutoRefresh]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    
    // Pan
    if (Math.abs(deltaX) > 10) {
      setPanOffset(prev => prev + deltaX / (zoomLevel * 2));
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    }
  }, [touchStart, zoomLevel]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  // Calculate visible range
  const visibleCandles = Math.max(10, Math.floor(50 / zoomLevel));
  const startIndex = Math.max(0, Math.min(
    candles.length - visibleCandles,
    candles.length - visibleCandles - Math.floor(panOffset)
  ));
  const endIndex = Math.min(candles.length, startIndex + visibleCandles);
  const displayCandles = candles.slice(startIndex, endIndex);

  // Calculate price range
  const prices = displayCandles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // Get latest candle for live updates
  const latestCandle = candles[candles.length - 1];
  const isLatestBullish = latestCandle?.isBullish;
  const latestMomentum = latestCandle?.momentum || 0;

  if (loading) {
    return (
      <Card className={`${isFullPage ? 'h-[calc(100vh-120px)]' : 'h-[500px]'} glass overflow-hidden`}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Activity className="h-12 w-12 animate-pulse mx-auto text-blue-500" />
            <div>
              <p className="text-lg font-semibold">Loading Chart Data</p>
              <p className="text-sm text-muted-foreground">Fetching live data from Binance...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${isFullPage ? 'h-[calc(100vh-120px)]' : 'h-[500px]'} glass overflow-hidden`}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <p className="text-lg font-semibold text-red-600">Chart Error</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isFullPage ? 'h-[calc(100vh-120px)]' : 'h-[500px]'} glass overflow-hidden shadow-2xl border-0`}>
      <CardHeader className="pb-2 px-3 bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-bold">{name}</CardTitle>
            <Badge variant="outline" className="text-xs bg-blue-900 text-blue-100 border-blue-700">
              {symbol}
            </Badge>
            {latestCandle && (
              <div className="flex items-center gap-2">
                {isLatestBullish ? (
                  <TrendingUp className="h-4 w-4 text-green-400 animate-pulse" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400 animate-pulse" />
                )}
                <span className={`text-sm font-mono ${isLatestBullish ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{(latestCandle.close * 84).toLocaleString('en-IN')}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs animate-pulse ${
                    latestMomentum > 50 ? 'bg-red-900 text-red-100 border-red-700' :
                    latestMomentum > 25 ? 'bg-yellow-900 text-yellow-100 border-yellow-700' :
                    'bg-green-900 text-green-100 border-green-700'
                  }`}
                >
                  M: {latestMomentum.toFixed(1)}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Interval Selector */}
            <div className="flex gap-1">
              {['15m', '1h', '4h', '1d'].map((int) => (
                <Button
                  key={int}
                  size="sm"
                  variant={interval === int ? "default" : "ghost"}
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setInterval(int);
                    pauseAutoRefresh();
                  }}
                >
                  {int}
                </Button>
              ))}
            </div>
            
            {/* Zoom Controls */}
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={zoomOut}>
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={zoomIn}>
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Live Status */}
            <div className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${isAutoRefresh ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
              <span className="text-xs">{isAutoRefresh ? 'LIVE' : 'PAUSED'}</span>
            </div>
            
            {onClose && (
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-80px)] relative overflow-hidden bg-gradient-to-b from-gray-900 to-black">
        <div
          ref={chartRef}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <svg width="100%" height="100%" className="overflow-visible">
            <defs>
              <linearGradient id="bullishGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#16a34a" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="bearishGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {displayCandles.map((candle, index) => {
              const x = (index / visibleCandles) * 100;
              const candleWidth = Math.max(2, (100 / visibleCandles) * 0.7);
              
              const openY = ((maxPrice + padding - candle.open) / (priceRange + 2 * padding)) * 100;
              const closeY = ((maxPrice + padding - candle.close) / (priceRange + 2 * padding)) * 100;  
              const highY = ((maxPrice + padding - candle.high) / (priceRange + 2 * padding)) * 100;
              const lowY = ((maxPrice + padding - candle.low) / (priceRange + 2 * padding)) * 100;
              
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.abs(openY - closeY);
              const isCurrentCandle = index === displayCandles.length - 1;
              
              // Enhanced momentum visualization
              const momentumIntensity = Math.min(candle.momentum / 20, 1);
              const glowIntensity = isCurrentCandle ? 1 : momentumIntensity;
              
              return (
                <g key={`${candle.timestamp}-${index}`}>
                  {/* High-Low Line (Wick) */}
                  <line
                    x1={`${x + candleWidth/2}%`}
                    y1={`${highY}%`}
                    x2={`${x + candleWidth/2}%`}
                    y2={`${lowY}%`}
                    stroke={candle.isBullish ? '#22c55e' : '#ef4444'}
                    strokeWidth={Math.max(1, candleWidth * 0.1)}
                    opacity={0.8}
                    filter={isCurrentCandle ? "url(#glow)" : undefined}
                  />
                  
                  {/* Candle Body */}
                  <rect
                    x={`${x}%`}
                    y={`${bodyTop}%`}
                    width={`${candleWidth}%`}
                    height={`${Math.max(bodyHeight, 0.5)}%`}
                    fill={candle.isBullish ? 'url(#bullishGradient)' : 'url(#bearishGradient)'}
                    stroke={candle.isBullish ? '#16a34a' : '#dc2626'}
                    strokeWidth={0.5}
                    opacity={isCurrentCandle ? 1 : 0.9}
                    filter={glowIntensity > 0.5 ? "url(#glow)" : undefined}
                    className={isCurrentCandle ? 'animate-pulse' : ''}
                  />
                  
                  {/* Enhanced Momentum Bar */}
                  {candle.momentum > 5 && (
                    <rect
                      x={`${x}%`}
                      y="95%"
                      width={`${candleWidth}%`}
                      height={`${Math.min(candle.momentum / 10, 5)}%`}
                      fill={
                        candle.momentum > 50 ? '#ef4444' :
                        candle.momentum > 25 ? '#f59e0b' : '#22c55e'
                      }
                      opacity={0.7}
                      className={isCurrentCandle ? 'animate-pulse' : ''}
                    />
                  )}
                  
                  {/* Live Price Indicator */}
                  {isCurrentCandle && (
                    <>
                      <circle
                        cx={`${x + candleWidth/2}%`}
                        cy={`${closeY}%`}
                        r="3"
                        fill={candle.isBullish ? '#22c55e' : '#ef4444'}
                        className="animate-ping"
                        opacity="0.6"
                      />
                      <circle
                        cx={`${x + candleWidth/2}%`}
                        cy={`${closeY}%`}
                        r="2"
                        fill={candle.isBullish ? '#22c55e' : '#ef4444'}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Chart Info Overlay */}
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
            <div>Zoom: {zoomLevel.toFixed(1)}x</div>
            <div>Candles: {displayCandles.length}</div>
            <div className="flex items-center gap-1">
              <Move className="h-3 w-3" />
              <span>Drag to pan • Wheel to zoom</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
