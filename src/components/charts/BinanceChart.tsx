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
  RefreshCw,
  Menu
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const isMobile = useIsMobile();
  
  const chartRef = useRef<HTMLDivElement>(null);
  const panTimeoutRef = useRef<number | null>(null);
  const refreshIntervalRef = useRef<number | null>(null);

  // Available intervals optimized for mobile
  const intervals = [
    { value: '1m', label: '1m' },
    { value: '3m', label: '3m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '2h', label: '2h' },
    { value: '4h', label: '4h' },
    { value: '6h', label: '6h' },
    { value: '8h', label: '8h' },
    { value: '12h', label: '12h' },
    { value: '1d', label: '1d' },
    { value: '3d', label: '3d' },
    { value: '1w', label: '1w' },
    { value: '1M', label: '1M' }
  ];

  // Mobile-friendly intervals for quick access
  const quickIntervals = ['1m', '5m', '15m', '1h', '4h', '1d'];

  // Fetch candle data
  const fetchData = useCallback(async () => {
    if (!symbol) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`[BinanceChart] Fetching ${symbol} data for ${interval}...`);
      
      const data = await binanceService.getKlines(symbol, interval, 200);
      setCandles(data);
      console.log(`[BinanceChart] Loaded ${data.length} candles for ${symbol} [${interval}]`);
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
      refreshIntervalRef.current = window.setInterval(() => {
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
    panTimeoutRef.current = window.setTimeout(() => {
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

  if (loading && candles.length === 0) {
    return (
      <Card className={`${isFullPage ? 'h-[calc(100vh-60px)]' : 'h-[400px]'} glass overflow-hidden`}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <Activity className="h-8 w-8 animate-pulse mx-auto text-blue-500" />
            <div>
              <p className="text-sm font-semibold">Loading Chart</p>
              <p className="text-xs text-muted-foreground">Fetching data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${isFullPage ? 'h-[calc(100vh-60px)]' : 'h-[400px]'} glass overflow-hidden`}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-600">Chart Error</p>
              <p className="text-xs text-muted-foreground mb-3">{error}</p>
              <Button onClick={fetchData} variant="outline" size="sm" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isFullPage ? 'h-[calc(100vh-60px)]' : 'h-[400px]'} glass overflow-hidden shadow-xl border-0`}>
      <CardHeader className="pb-1 px-2 bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CardTitle className="text-sm font-bold truncate">{name}</CardTitle>
            <Badge variant="outline" className="text-xs bg-blue-900 text-blue-100 border-blue-700 px-1">
              {symbol}
            </Badge>
            {latestCandle && (
              <div className="flex items-center gap-1">
                {isLatestBullish ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs font-mono ${isLatestBullish ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{(latestCandle.close * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Mobile Interval Menu */}
            {isMobile ? (
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowIntervalMenu(!showIntervalMenu)}
                >
                  <Menu className="h-3 w-3 mr-1" />
                  {interval}
                </Button>
                {showIntervalMenu && (
                  <div className="absolute top-7 right-0 bg-black/95 border border-gray-700 rounded-md p-2 grid grid-cols-3 gap-1 z-50 min-w-32">
                    {intervals.map((int) => (
                      <Button
                        key={int.value}
                        size="sm"
                        variant={interval === int.value ? "default" : "ghost"}
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setInterval(int.value);
                          setShowIntervalMenu(false);
                          pauseAutoRefresh();
                        }}
                      >
                        {int.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Desktop Interval Buttons */
              <div className="flex gap-1 flex-wrap max-w-md">
                {quickIntervals.map((int) => (
                  <Button
                    key={int}
                    size="sm"
                    variant={interval === int ? "default" : "ghost"}
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setInterval(int);
                      pauseAutoRefresh();
                    }}
                  >
                    {int}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Zoom Controls */}
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-6 px-1" onClick={zoomOut}>
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-1" onClick={zoomIn}>
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Live Status */}
            <div className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full ${isAutoRefresh ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
              <span className="text-xs">{isAutoRefresh ? 'LIVE' : 'PAUSE'}</span>
            </div>
            
            {onClose && (
              <Button size="sm" variant="ghost" className="h-6 px-1" onClick={onClose}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-50px)] relative overflow-hidden bg-gradient-to-b from-gray-900 to-black">
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
              const candleWidth = Math.max(1, (100 / visibleCandles) * 0.7);
              
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
                    strokeWidth={Math.max(0.5, candleWidth * 0.1)}
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
                    strokeWidth={0.3}
                    opacity={isCurrentCandle ? 1 : 0.9}
                    filter={glowIntensity > 0.5 ? "url(#glow)" : undefined}
                    className={isCurrentCandle ? 'animate-pulse' : ''}
                  />
                  
                  {/* Enhanced Momentum Bar */}
                  {candle.momentum > 5 && (
                    <rect
                      x={`${x}%`}
                      y="96%"
                      width={`${candleWidth}%`}
                      height={`${Math.min(candle.momentum / 15, 4)}%`}
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
                        r={isMobile ? "2" : "3"}
                        fill={candle.isBullish ? '#22c55e' : '#ef4444'}
                        className="animate-ping"
                        opacity="0.6"
                      />
                      <circle
                        cx={`${x + candleWidth/2}%`}
                        cy={`${closeY}%`}
                        r={isMobile ? "1" : "2"}
                        fill={candle.isBullish ? '#22c55e' : '#ef4444'}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Mobile-Optimized Chart Info Overlay */}
          <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm rounded-md p-1 text-white text-xs">
            <div className="text-xs">Z: {zoomLevel.toFixed(1)}x • {displayCandles.length}</div>
            {!isMobile && (
              <div className="flex items-center gap-1 text-xs">
                <Move className="h-2 w-2" />
                <span>Drag • Wheel zoom</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
