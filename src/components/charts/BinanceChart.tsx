import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  AlertCircle,
  Activity,
  Loader2,
  ZoomIn,
  ZoomOut,
  Home
} from 'lucide-react';
import { binanceService, ProcessedCandle } from '@/services/binanceService';
import { useIsMobile } from '@/hooks/use-mobile';

interface BinanceChartProps {
  symbol: string;
  name: string;
  onClose?: () => void;
  isFullPage?: boolean;
}

export function BinanceChart({ symbol, name, onClose, isFullPage = false }: BinanceChartProps) {
  const [chartData, setChartData] = useState<ProcessedCandle[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const [liveUpdate, setLiveUpdate] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const isMobile = useIsMobile();

  const timeframes = [
    { key: '1m', label: '1M' },
    { key: '5m', label: '5M' },
    { key: '15m', label: '15M' },
    { key: '1h', label: '1H' },
    { key: '4h', label: '4H' },
    { key: '1d', label: '1D' }
  ];

  const fetchChartData = async () => {
    if (!isRefreshing) setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching Binance data for ${symbol} with ${timeframe} timeframe`);
      
      const [candleData, priceData] = await Promise.all([
        binanceService.getKlines(symbol, timeframe, 500),
        binanceService.getCurrentPrice(symbol)
      ]);
      
      if (candleData && candleData.length > 0) {
        setChartData(candleData);
        setCurrentPrice(priceData);
        console.log(`Successfully loaded ${candleData.length} candles with momentum data`);
      } else {
        throw new Error('No data received from Binance');
      }
    } catch (err) {
      console.error('Binance chart error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  // Live update animation for current candle
  useEffect(() => {
    const animateLiveCandle = () => {
      setLiveUpdate(prev => prev + 1);
      animationRef.current = requestAnimationFrame(animateLiveCandle);
    };
    
    if (chartData.length > 0 && (timeframe === '1m' || timeframe === '5m')) {
      animationRef.current = requestAnimationFrame(animateLiveCandle);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chartData, timeframe]);

  // Auto-refresh every 10 seconds for faster timeframes
  useEffect(() => {
    const refreshInterval = timeframe === '1m' ? 10000 : timeframe === '5m' ? 30000 : 60000;
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchChartData();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  // Touch and mouse event handlers for pan and zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX,
        offset: panOffset
      });
    }
  }, [panOffset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const newOffset = dragStart.offset + deltaX * 0.5;
      setPanOffset(Math.max(-chartData.length * 0.3, Math.min(chartData.length * 0.3, newOffset)));
    }
  }, [isDragging, dragStart, chartData.length]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      offset: panOffset
    });
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const newOffset = dragStart.offset + deltaX * 0.5;
      setPanOffset(Math.max(-chartData.length * 0.3, Math.min(chartData.length * 0.3, newOffset)));
    }
  }, [isDragging, dragStart, chartData.length]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev * 1.5 : prev / 1.5;
      return Math.max(0.5, Math.min(5, newZoom));
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerRect = container.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    canvas.width = containerRect.width * devicePixelRatio;
    canvas.height = containerRect.height * devicePixelRatio;
    canvas.style.width = containerRect.width + 'px';
    canvas.style.height = containerRect.height + 'px';
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    const { width, height } = containerRect;
    ctx.clearRect(0, 0, width, height);

    const padding = isMobile ? 40 : 80;
    const bottomPadding = isMobile ? 80 : 100;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding - bottomPadding;

    // Apply zoom and pan
    const visibleCandles = Math.floor(chartData.length / zoomLevel);
    const startIndex = Math.max(0, Math.floor(chartData.length - visibleCandles - panOffset / 10));
    const endIndex = Math.min(chartData.length, startIndex + visibleCandles);
    const visibleData = chartData.slice(startIndex, endIndex);

    if (visibleData.length === 0) return;

    // Calculate price range for visible data
    const prices = visibleData.flatMap(d => [d.high, d.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) return;

    // Professional grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;
    
    const hLines = isMobile ? 8 : 12;
    for (let i = 0; i <= hLines; i++) {
      const y = padding + (chartHeight / hLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    const vLines = Math.min(visibleData.length, isMobile ? 8 : 15);
    for (let i = 0; i <= vLines; i++) {
      const x = padding + (chartWidth / vLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - bottomPadding);
      ctx.stroke();
    }

    const candleWidth = Math.max((chartWidth / visibleData.length) * 0.8, isMobile ? 2 : 3);
    const candleSpacing = chartWidth / visibleData.length;
    
    // Draw momentum bars
    const maxMomentum = Math.max(...visibleData.map(c => c.momentum));
    visibleData.forEach((candle, index) => {
      const x = padding + (index * candleSpacing) + candleSpacing / 2;
      
      if (candle.momentum > 5) {
        const momentumHeight = (candle.momentum / maxMomentum) * 50;
        const momentumY = height - bottomPadding + 15;
        
        const momentumAlpha = Math.min(candle.momentum / 40, 0.9);
        const momentumColor = candle.isBullish 
          ? `rgba(2, 192, 118, ${momentumAlpha})` 
          : `rgba(248, 73, 96, ${momentumAlpha})`;
        
        ctx.fillStyle = momentumColor;
        ctx.fillRect(x - candleWidth/2, momentumY, candleWidth, momentumHeight);
        
        if (candle.momentum > 35) {
          ctx.shadowColor = candle.isBullish ? '#02C076' : '#F84960';
          ctx.shadowBlur = 4;
          ctx.fillRect(x - candleWidth/2, momentumY, candleWidth, momentumHeight);
          ctx.shadowBlur = 0;
        }
      }
    });
    
    // Draw candlesticks with live animation
    visibleData.forEach((candle, index) => {
      const x = padding + (index * candleSpacing) + candleSpacing / 2;
      const isLastCandle = index === visibleData.length - 1;
      
      // Binance colors
      const bullColor = '#02C076';
      const bearColor = '#F84960';
      let baseColor = candle.isBullish ? bullColor : bearColor;
      
      // Live candle animation
      if (isLastCandle && (timeframe === '1m' || timeframe === '5m')) {
        const pulse = Math.sin(liveUpdate * 0.1) * 0.3 + 0.7;
        baseColor = candle.isBullish 
          ? `rgba(2, 192, 118, ${pulse})` 
          : `rgba(248, 73, 96, ${pulse})`;
      }
      
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      
      // Enhanced momentum glow
      if (candle.momentum > 25) {
        const glowRadius = Math.min(candle.momentum / 6, isMobile ? 8 : 12);
        const gradient = ctx.createRadialGradient(x, (openY + closeY) / 2, 0, x, (openY + closeY) / 2, glowRadius);
        gradient.addColorStop(0, (candle.isBullish ? bullColor : bearColor) + '80');
        gradient.addColorStop(1, (candle.isBullish ? bullColor : bearColor) + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, (openY + closeY) / 2, glowRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Draw wick
      const wickThickness = Math.max(1, 1.5 + (candle.momentum / 80) * (isMobile ? 1.5 : 2.5));
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = wickThickness;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      const enhancedWidth = candleWidth + (candle.momentum / 150) * (isMobile ? 3 : 5);
      
      ctx.fillStyle = baseColor;
      
      if (candle.isBullish) {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = Math.max(1.5, candle.momentum / 30);
        ctx.strokeRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1.5));
        
        if (candle.momentum > 20) {
          ctx.globalAlpha = Math.min(candle.momentum / 80, 0.5);
          ctx.fillRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1.5));
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.globalAlpha = Math.max(0.8, Math.min(1, 0.8 + candle.momentum / 80));
        ctx.fillRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1.5));
        ctx.globalAlpha = 1;
      }
    });

    // Price scale
    ctx.fillStyle = '#FFFFFF';
    ctx.font = isMobile ? '10px "Inter", system-ui, sans-serif' : '12px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'right';
    
    const priceLines = isMobile ? 8 : 12;
    for (let i = 0; i <= priceLines; i++) {
      const price = minPrice + (priceRange / priceLines) * i;
      const y = padding + chartHeight - (chartHeight / priceLines) * i;
      const priceText = price > 1 ? price.toFixed(2) : price.toFixed(6);
      
      const textWidth = ctx.measureText(`$${priceText}`).width;
      const labelPadding = isMobile ? 4 : 8;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(width - padding - textWidth - labelPadding - 2, y - (isMobile ? 6 : 8), 
                   textWidth + labelPadding, isMobile ? 12 : 16);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`$${priceText}`, width - padding - 2, y + (isMobile ? 2 : 4));
    }

    // Current price line with animation
    if (currentPrice) {
      const currentPriceNum = parseFloat(currentPrice.lastPrice);
      const currentPriceY = padding + ((maxPrice - currentPriceNum) / priceRange) * chartHeight;
      const isPositive = parseFloat(currentPrice.priceChangePercent) >= 0;
      
      // Animated dashed line
      const dashOffset = (liveUpdate * 0.5) % 20;
      ctx.strokeStyle = isPositive ? '#02C076' : '#F84960';
      ctx.lineWidth = isMobile ? 2 : 2.5;
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -dashOffset;
      ctx.globalAlpha = 0.95;
      
      ctx.beginPath();
      ctx.moveTo(padding, currentPriceY);
      ctx.lineTo(width - padding, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.globalAlpha = 1;
      
      // Price label
      const priceText = currentPriceNum > 1 ? currentPriceNum.toFixed(2) : currentPriceNum.toFixed(6);
      const labelWidth = isMobile ? 90 : 120;
      const labelHeight = isMobile ? 24 : 32;
      
      ctx.fillStyle = isPositive ? '#02C076' : '#F84960';
      ctx.fillRect(width - padding - labelWidth, currentPriceY - labelHeight/2, labelWidth, labelHeight);
      
      ctx.fillStyle = 'white';
      ctx.font = isMobile ? 'bold 10px "Inter", monospace' : 'bold 12px "Inter", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`$${priceText}`, width - padding - labelWidth/2, currentPriceY + (isMobile ? 3 : 4));
    }

    // Zoom level indicator
    if (zoomLevel !== 1 || panOffset !== 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(padding, padding, isMobile ? 80 : 100, isMobile ? 30 : 40);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isMobile ? '9px "Inter", system-ui, sans-serif' : '11px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Zoom: ${zoomLevel.toFixed(1)}x`, padding + 5, padding + (isMobile ? 15 : 18));
      ctx.fillText(`${startIndex}-${endIndex}/${chartData.length}`, padding + 5, padding + (isMobile ? 25 : 32));
    }
  };

  useEffect(() => {
    const resizeCanvas = () => {
      if (chartData.length > 0) {
        drawChart();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [chartData, currentPrice, isMobile, zoomLevel, panOffset, liveUpdate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChartData();
  };

  // Statistics
  const avgMomentum = chartData.length > 0 
    ? chartData.reduce((sum, c) => sum + c.momentum, 0) / chartData.length 
    : 0;
  const highMomentumCandles = chartData.filter(c => c.momentum > 30).length;
  const maxMomentum = chartData.length > 0 ? Math.max(...chartData.map(c => c.momentum)) : 0;

  const chartHeight = isFullPage 
    ? (isMobile ? 'h-[70vh]' : 'h-[80vh]')
    : (isMobile ? 'h-[400px]' : 'h-[600px]');

  return (
    <Card className={`bg-gradient-to-br from-gray-900 to-black border-gray-700 ${isFullscreen ? 'fixed inset-4 z-50 max-w-none' : 'w-full'}`}>
      <CardHeader className="border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 p-3 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <CardTitle className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {symbol}
            </CardTitle>
            <Badge variant="outline" className="text-green-400 border-green-400 animate-pulse text-xs">
              LIVE
            </Badge>
            {currentPrice && (
              <Badge 
                variant={parseFloat(currentPrice.priceChangePercent) >= 0 ? 'default' : 'destructive'}
                className={`px-2 py-1 ${isMobile ? 'text-xs' : ''}`}
              >
                {parseFloat(currentPrice.priceChangePercent) >= 0 ? 
                  <TrendingUp className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} /> : 
                  <TrendingDown className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                }
                {Math.abs(parseFloat(currentPrice.priceChangePercent)).toFixed(2)}%
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleZoom('in')} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleZoom('out')} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetView} title="Reset View">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {!isFullPage && !isMobile && (
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${isMobile ? 'p-3' : 'p-6'}`}>
        {/* Price Info */}
        {currentPrice && (
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-4 rounded-lg border border-gray-600">
            <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-3' : ''}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <div className={`font-bold text-white font-mono ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
                  ${parseFloat(currentPrice.lastPrice).toFixed(parseFloat(currentPrice.lastPrice) > 1 ? 2 : 6)}
                </div>
                <div className={`flex items-center gap-2 mt-2 ${parseFloat(currentPrice.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'} ${isMobile ? 'justify-center' : ''}`}>
                  {parseFloat(currentPrice.priceChangePercent) >= 0 ? 
                    <TrendingUp className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} /> : 
                    <TrendingDown className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
                  }
                  <span className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {parseFloat(currentPrice.priceChangePercent) >= 0 ? '+' : ''}
                    ${parseFloat(currentPrice.priceChange).toFixed(4)} 
                    ({parseFloat(currentPrice.priceChangePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
                <div className="flex items-center gap-2 text-blue-400 mb-2 justify-center">
                  <Activity className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>Live Momentum</span>
                </div>
                <div className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <div>Avg: {avgMomentum.toFixed(1)}%</div>
                  <div>Max: {maxMomentum.toFixed(1)}%</div>
                  <div>Zoom: {zoomLevel.toFixed(1)}x</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe Selector */}
        <div className={`flex gap-1 justify-center ${isMobile ? 'flex-wrap' : 'gap-2'}`}>
          {timeframes.map((tf) => (
            <Button
              key={tf.key}
              variant={timeframe === tf.key ? 'default' : 'outline'}
              size={isMobile ? 'sm' : 'sm'}
              onClick={() => setTimeframe(tf.key)}
              className={`${timeframe === tf.key ? 'bg-blue-600 hover:bg-blue-700' : ''} ${isMobile ? 'text-xs px-3 py-1' : ''}`}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        {/* Chart Container */}
        <div className="relative">
          {isLoading ? (
            <div className={`${chartHeight} flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700`}>
              <div className="text-center text-white">
                <Loader2 className={`animate-spin mx-auto mb-4 text-blue-400 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                <p className={isMobile ? 'text-base' : 'text-lg'}>Loading Live Chart...</p>
                <p className={`text-gray-400 mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>Connecting to Binance...</p>
              </div>
            </div>
          ) : error ? (
            <div className={`${chartHeight} flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700`}>
              <div className="text-center text-white max-w-md px-4">
                <AlertCircle className={`mx-auto mb-4 text-red-400 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                <p className={isMobile ? 'text-base mb-2' : 'text-lg mb-2'}>Chart Loading Failed</p>
                <p className={`text-red-400 mb-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>{error}</p>
                <Button onClick={fetchChartData} variant="outline" size={isMobile ? 'sm' : 'default'}>
                  <RefreshCw className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  Retry Connection
                </Button>
              </div>
            </div>
          ) : (
            <div ref={containerRef} className={`${chartHeight} bg-black rounded-lg border border-gray-700 overflow-hidden relative`}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                style={{ imageRendering: 'auto', touchAction: 'none' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              {/* Chart Controls */}
              <div className={`absolute top-2 right-2 flex gap-1 ${isMobile ? 'flex-col' : ''}`}>
                <Button size="sm" variant="outline" onClick={() => handleZoom('in')} className="bg-black/80 border-gray-600">
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleZoom('out')} className="bg-black/80 border-gray-600">
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={resetView} className="bg-black/80 border-gray-600">
                  <Home className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Legend */}
              <div className={`absolute top-2 left-2 bg-black/90 rounded p-2 text-white ${isMobile ? 'text-xs' : 'text-xs'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-2 bg-[#02C076] rounded animate-pulse"></div>
                  <span>Bullish Live</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-2 bg-[#F84960] rounded animate-pulse"></div>
                  <span>Bearish Live</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-blue-400" />
                  <span>Momentum</span>
                </div>
              </div>
              
              {/* Instructions */}
              <div className={`absolute bottom-2 left-2 bg-black/80 rounded p-2 text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? 'Touch & drag to pan • Pinch to zoom' : 'Drag to pan • Use controls to zoom'}
              </div>
            </div>
          )}
        </div>

        {/* Market Stats */}
        {currentPrice && (
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-2 text-xs' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600 text-center">
              <p className="text-gray-400 mb-1 text-xs">24h High</p>
              <p className={`font-bold text-green-400 font-mono ${isMobile ? 'text-xs' : ''}`}>
                ${parseFloat(currentPrice.highPrice).toFixed(parseFloat(currentPrice.highPrice) > 1 ? 2 : 6)}
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600 text-center">
              <p className="text-gray-400 mb-1 text-xs">24h Low</p>
              <p className={`font-bold text-red-400 font-mono ${isMobile ? 'text-xs' : ''}`}>
                ${parseFloat(currentPrice.lowPrice).toFixed(parseFloat(currentPrice.lowPrice) > 1 ? 2 : 6)}
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600 text-center">
              <p className="text-gray-400 mb-1 text-xs">24h Volume</p>
              <p className={`font-bold text-white font-mono ${isMobile ? 'text-xs' : ''}`}>
                {(parseFloat(currentPrice.volume) / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600 text-center">
              <p className="text-gray-400 mb-1 text-xs">Momentum</p>
              <p className={`font-bold text-blue-400 font-mono ${isMobile ? 'text-xs' : ''}`}>
                {maxMomentum.toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
