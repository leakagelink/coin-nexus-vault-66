
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
  const [livePulse, setLivePulse] = useState(0);
  const [lastPrice, setLastPrice] = useState<number>(0);
  
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
        
        // Track price changes for live momentum
        const newPrice = parseFloat(priceData.lastPrice);
        if (lastPrice > 0 && Math.abs(newPrice - lastPrice) > 0) {
          setLivePulse(prev => prev + 1);
        }
        setLastPrice(newPrice);
        
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

  // Enhanced live update animation with faster momentum
  useEffect(() => {
    const animateLiveCandle = () => {
      setLiveUpdate(prev => prev + 0.3); // Faster animation
      animationRef.current = requestAnimationFrame(animateLiveCandle);
    };
    
    if (chartData.length > 0) {
      animationRef.current = requestAnimationFrame(animateLiveCandle);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chartData, timeframe]);

  // Fast refresh for live momentum
  useEffect(() => {
    const refreshInterval = timeframe === '1m' ? 3000 : timeframe === '5m' ? 5000 : 10000;
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchChartData();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  // Touch and gesture handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX,
        offset: panOffset
      });
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      setDragStart({ x: distance, offset: zoomLevel });
    }
  }, [panOffset, zoomLevel]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const sensitivity = isMobile ? 1.5 : 0.5;
      const newOffset = dragStart.offset + deltaX * sensitivity;
      setPanOffset(Math.max(-chartData.length * 0.5, Math.min(chartData.length * 0.5, newOffset)));
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      const scale = distance / dragStart.x;
      const newZoom = dragStart.offset * scale;
      setZoomLevel(Math.max(0.3, Math.min(8, newZoom)));
    }
  }, [isDragging, dragStart, chartData.length, isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      offset: panOffset
    });
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const newOffset = dragStart.offset + deltaX * 0.8;
      setPanOffset(Math.max(-chartData.length * 0.4, Math.min(chartData.length * 0.4, newOffset)));
    }
  }, [isDragging, dragStart, chartData.length]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handlers
  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const factor = isMobile ? 1.8 : 1.5;
      const newZoom = direction === 'in' ? prev * factor : prev / factor;
      return Math.max(0.3, Math.min(8, newZoom));
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };

  // Enhanced chart drawing with live momentum
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

    const padding = isMobile ? 30 : 60;
    const bottomPadding = isMobile ? 90 : 110;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding - bottomPadding;

    // Calculate visible data with zoom and pan
    const visibleCandles = Math.max(10, Math.floor(chartData.length / zoomLevel));
    const startIndex = Math.max(0, Math.floor(chartData.length - visibleCandles - panOffset / 8));
    const endIndex = Math.min(chartData.length, startIndex + visibleCandles);
    const visibleData = chartData.slice(startIndex, endIndex);

    if (visibleData.length === 0) return;

    // Calculate price range
    const prices = visibleData.flatMap(d => [d.high, d.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) return;

    // Professional grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.8;
    
    const hLines = isMobile ? 6 : 10;
    for (let i = 0; i <= hLines; i++) {
      const y = padding + (chartHeight / hLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    const vLines = Math.min(visibleData.length, isMobile ? 6 : 12);
    for (let i = 0; i <= vLines; i++) {
      const x = padding + (chartWidth / vLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - bottomPadding);
      ctx.stroke();
    }

    const candleWidth = Math.max((chartWidth / visibleData.length) * 0.7, isMobile ? 3 : 4);
    const candleSpacing = chartWidth / visibleData.length;
    
    // Enhanced momentum visualization at bottom
    const maxMomentum = Math.max(...visibleData.map(c => c.momentum), 20);
    visibleData.forEach((candle, index) => {
      const x = padding + (index * candleSpacing) + candleSpacing / 2;
      
      if (candle.momentum > 3) {
        const momentumHeight = Math.max((candle.momentum / maxMomentum) * 60, 4);
        const momentumY = height - bottomPadding + 20;
        
        const momentumAlpha = Math.min(candle.momentum / 30, 0.9);
        const momentumColor = candle.isBullish 
          ? `rgba(2, 192, 118, ${momentumAlpha})` 
          : `rgba(248, 73, 96, ${momentumAlpha})`;
        
        ctx.fillStyle = momentumColor;
        ctx.fillRect(x - candleWidth/2, momentumY, candleWidth, momentumHeight);
        
        // High momentum glow
        if (candle.momentum > 25) {
          ctx.shadowColor = candle.isBullish ? '#02C076' : '#F84960';
          ctx.shadowBlur = 6;
          ctx.fillRect(x - candleWidth/2, momentumY, candleWidth, momentumHeight);
          ctx.shadowBlur = 0;
        }
      }
    });
    
    // Draw candlesticks with enhanced live animation
    visibleData.forEach((candle, index) => {
      const x = padding + (index * candleSpacing) + candleSpacing / 2;
      const isLastCandle = index === visibleData.length - 1;
      
      // Binance professional colors
      const bullColor = '#02C076';
      const bearColor = '#F84960';
      let baseColor = candle.isBullish ? bullColor : bearColor;
      
      // Enhanced live candle animation with fast momentum
      if (isLastCandle) {
        const fastPulse = Math.sin(liveUpdate * 0.4) * 0.4 + 0.6;
        const momentumPulse = Math.sin(livePulse * 0.8) * 0.3 + 0.7;
        const combinedPulse = (fastPulse + momentumPulse) / 2;
        
        baseColor = candle.isBullish 
          ? `rgba(2, 192, 118, ${combinedPulse})` 
          : `rgba(248, 73, 96, ${combinedPulse})`;
      }
      
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      
      // Super enhanced momentum glow for high activity
      if (candle.momentum > 20) {
        const glowRadius = Math.min(candle.momentum / 4, isMobile ? 12 : 18);
        const glowIntensity = Math.min(candle.momentum / 50, 0.8);
        
        const gradient = ctx.createRadialGradient(x, (openY + closeY) / 2, 0, x, (openY + closeY) / 2, glowRadius);
        gradient.addColorStop(0, `${candle.isBullish ? bullColor : bearColor}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${candle.isBullish ? bullColor : bearColor}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, (openY + closeY) / 2, glowRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Draw enhanced wick with momentum thickness
      const wickThickness = Math.max(1.5, 2 + (candle.momentum / 60) * (isMobile ? 2 : 3));
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = wickThickness;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body with momentum enhancement
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      const enhancedWidth = candleWidth + (candle.momentum / 100) * (isMobile ? 4 : 6);
      
      ctx.fillStyle = baseColor;
      
      if (candle.isBullish) {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = Math.max(2, candle.momentum / 20);
        ctx.strokeRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 2));
        
        if (candle.momentum > 15) {
          ctx.globalAlpha = Math.min(candle.momentum / 60, 0.6);
          ctx.fillRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 2));
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.globalAlpha = Math.max(0.8, Math.min(1, 0.8 + candle.momentum / 60));
        ctx.fillRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 2));
        ctx.globalAlpha = 1;
      }
    });

    // Professional price scale
    ctx.fillStyle = '#FFFFFF';
    ctx.font = isMobile ? 'bold 9px "Inter", monospace' : 'bold 11px "Inter", monospace';
    ctx.textAlign = 'right';
    
    const priceLines = isMobile ? 6 : 10;
    for (let i = 0; i <= priceLines; i++) {
      const price = minPrice + (priceRange / priceLines) * i;
      const y = padding + chartHeight - (chartHeight / priceLines) * i;
      const priceText = price > 1 ? price.toFixed(2) : price.toFixed(6);
      
      const textWidth = ctx.measureText(`$${priceText}`).width;
      const labelPadding = isMobile ? 6 : 10;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.fillRect(width - padding - textWidth - labelPadding - 3, y - (isMobile ? 7 : 9), 
                   textWidth + labelPadding, isMobile ? 14 : 18);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`$${priceText}`, width - padding - 3, y + (isMobile ? 3 : 5));
    }

    // Animated current price line with live momentum
    if (currentPrice) {
      const currentPriceNum = parseFloat(currentPrice.lastPrice);
      const currentPriceY = padding + ((maxPrice - currentPriceNum) / priceRange) * chartHeight;
      const isPositive = parseFloat(currentPrice.priceChangePercent) >= 0;
      
      // Highly animated dashed line with momentum
      const dashOffset = (liveUpdate * 1.2) % 24;
      const lineOpacity = 0.9 + Math.sin(liveUpdate * 0.3) * 0.1;
      
      ctx.strokeStyle = isPositive ? `rgba(2, 192, 118, ${lineOpacity})` : `rgba(248, 73, 96, ${lineOpacity})`;
      ctx.lineWidth = isMobile ? 2.5 : 3;
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = -dashOffset;
      
      ctx.beginPath();
      ctx.moveTo(padding, currentPriceY);
      ctx.lineTo(width - padding, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      
      // Enhanced price label with pulsing animation
      const priceText = currentPriceNum > 1 ? currentPriceNum.toFixed(2) : currentPriceNum.toFixed(6);
      const labelWidth = isMobile ? 100 : 130;
      const labelHeight = isMobile ? 28 : 36;
      const labelPulse = 0.9 + Math.sin(liveUpdate * 0.4) * 0.1;
      
      ctx.fillStyle = isPositive ? `rgba(2, 192, 118, ${labelPulse})` : `rgba(248, 73, 96, ${labelPulse})`;
      ctx.fillRect(width - padding - labelWidth, currentPriceY - labelHeight/2, labelWidth, labelHeight);
      
      // Shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillRect(width - padding - labelWidth, currentPriceY - labelHeight/2, labelWidth, labelHeight);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = 'white';
      ctx.font = isMobile ? 'bold 11px "Inter", monospace' : 'bold 13px "Inter", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`$${priceText}`, width - padding - labelWidth/2, currentPriceY + (isMobile ? 4 : 6));
    }

    // Enhanced zoom and pan indicator
    if (zoomLevel !== 1 || panOffset !== 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(padding, padding, isMobile ? 90 : 120, isMobile ? 35 : 45);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isMobile ? 'bold 8px "Inter", monospace' : 'bold 10px "Inter", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Zoom: ${zoomLevel.toFixed(1)}x`, padding + 6, padding + (isMobile ? 12 : 16));
      ctx.fillText(`Range: ${startIndex}-${endIndex}`, padding + 6, padding + (isMobile ? 24 : 30));
      ctx.fillText(`Total: ${chartData.length}`, padding + 6, padding + (isMobile ? 32 : 40));
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
  }, [chartData, currentPrice, isMobile, zoomLevel, panOffset, liveUpdate, livePulse]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChartData();
  };

  // Statistics with live momentum
  const avgMomentum = chartData.length > 0 
    ? chartData.reduce((sum, c) => sum + c.momentum, 0) / chartData.length 
    : 0;
  const highMomentumCandles = chartData.filter(c => c.momentum > 30).length;
  const maxMomentum = chartData.length > 0 ? Math.max(...chartData.map(c => c.momentum)) : 0;

  const chartHeight = isFullPage 
    ? (isMobile ? 'h-[75vh]' : 'h-[85vh]')
    : (isMobile ? 'h-[450px]' : 'h-[650px]');

  return (
    <Card className={`bg-gradient-to-br from-gray-900 to-black border-gray-700 ${isFullscreen ? 'fixed inset-2 z-50 max-w-none' : 'w-full'}`}>
      <CardHeader className="border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 p-2 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <CardTitle className={`font-bold text-white ${isMobile ? 'text-base' : 'text-xl'}`}>
              {symbol}
            </CardTitle>
            <Badge variant="outline" className="text-green-400 border-green-400 animate-pulse text-xs px-1 py-0">
              LIVE
            </Badge>
            {currentPrice && (
              <Badge 
                variant={parseFloat(currentPrice.priceChangePercent) >= 0 ? 'default' : 'destructive'}
                className={`px-1.5 py-0.5 ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                {parseFloat(currentPrice.priceChangePercent) >= 0 ? 
                  <TrendingUp className={`mr-1 ${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} /> : 
                  <TrendingDown className={`mr-1 ${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                }
                {Math.abs(parseFloat(currentPrice.priceChangePercent)).toFixed(2)}%
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "sm"} 
              onClick={() => handleZoom('in')} 
              className="p-1.5"
              title="Zoom In"
            >
              <ZoomIn className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "sm"} 
              onClick={() => handleZoom('out')} 
              className="p-1.5"
              title="Zoom Out"
            >
              <ZoomOut className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "sm"} 
              onClick={resetView} 
              className="p-1.5"
              title="Reset View"
            >
              <Home className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "sm"} 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="p-1.5"
            >
              <RefreshCw className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {!isFullPage && !isMobile && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button 
                variant="ghost" 
                size={isMobile ? "sm" : "sm"} 
                onClick={onClose}
                className="p-1.5"
              >
                <X className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`space-y-3 ${isMobile ? 'p-2' : 'p-4'}`}>
        {/* Enhanced Price Info with Live Animation */}
        {currentPrice && (
          <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 p-3 rounded-lg border border-gray-600">
            <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-2' : ''}`}>
              <div className={isMobile ? 'text-center w-full' : ''}>
                <div className={`font-bold text-white font-mono ${isMobile ? 'text-xl' : 'text-3xl'} animate-pulse`}>
                  ${parseFloat(currentPrice.lastPrice).toFixed(parseFloat(currentPrice.lastPrice) > 1 ? 2 : 6)}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${parseFloat(currentPrice.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'} ${isMobile ? 'justify-center text-sm' : 'text-base'}`}>
                  {parseFloat(currentPrice.priceChangePercent) >= 0 ? 
                    <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} animate-bounce`} /> : 
                    <TrendingDown className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} animate-bounce`} />
                  }
                  <span className="font-semibold">
                    {parseFloat(currentPrice.priceChangePercent) >= 0 ? '+' : ''}
                    ${parseFloat(currentPrice.priceChange).toFixed(4)} 
                    ({parseFloat(currentPrice.priceChangePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className={`${isMobile ? 'text-center w-full' : 'text-right'}`}>
                <div className="flex items-center gap-1 text-blue-400 mb-1 justify-center">
                  <Activity className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} animate-pulse`} />
                  <span className="text-xs">Live Momentum</span>
                </div>
                <div className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'} space-y-0.5`}>
                  <div>Avg: {avgMomentum.toFixed(1)}%</div>
                  <div>Max: {maxMomentum.toFixed(1)}%</div>
                  <div>Zoom: {zoomLevel.toFixed(1)}x</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-Optimized Timeframe Selector */}
        <div className={`flex gap-1 justify-center ${isMobile ? 'flex-wrap' : 'gap-2'}`}>
          {timeframes.map((tf) => (
            <Button
              key={tf.key}
              variant={timeframe === tf.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf.key)}
              className={`${timeframe === tf.key ? 'bg-blue-600 hover:bg-blue-700' : ''} ${isMobile ? 'text-xs px-2 py-1 min-w-[35px]' : 'px-3 py-1'}`}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        {/* Enhanced Chart Container */}
        <div className="relative">
          {isLoading ? (
            <div className={`${chartHeight} flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700`}>
              <div className="text-center text-white">
                <Loader2 className={`animate-spin mx-auto mb-3 text-blue-400 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <p className={isMobile ? 'text-sm' : 'text-base'}>Loading Live Chart...</p>
                <p className={`text-gray-400 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Connecting to Binance...</p>
              </div>
            </div>
          ) : error ? (
            <div className={`${chartHeight} flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700`}>
              <div className="text-center text-white max-w-md px-4">
                <AlertCircle className={`mx-auto mb-3 text-red-400 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <p className={isMobile ? 'text-sm mb-1' : 'text-base mb-2'}>Chart Loading Failed</p>
                <p className={`text-red-400 mb-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>{error}</p>
                <Button onClick={fetchChartData} variant="outline" size="sm">
                  <RefreshCw className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  Retry Connection
                </Button>
              </div>
            </div>
          ) : (
            <div ref={containerRef} className={`${chartHeight} bg-black rounded-lg border border-gray-700 overflow-hidden relative`}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                style={{ 
                  imageRendering: 'auto', 
                  touchAction: 'none',
                  userSelect: 'none'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              {/* Mobile-Optimized Chart Controls */}
              <div className={`absolute ${isMobile ? 'top-1 right-1 flex-col gap-1' : 'top-2 right-2'} flex gap-1`}>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleZoom('in')} 
                  className="bg-black/90 border-gray-600 p-1.5"
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleZoom('out')} 
                  className="bg-black/90 border-gray-600 p-1.5"
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={resetView} 
                  className="bg-black/90 border-gray-600 p-1.5"
                >
                  <Home className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Enhanced Legend */}
              <div className={`absolute ${isMobile ? 'top-1 left-1' : 'top-2 left-2'} bg-black/95 rounded p-2 text-white ${isMobile ? 'text-xs' : 'text-xs'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-1.5 bg-[#02C076] rounded animate-pulse"></div>
                  <span>Bull</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-1.5 bg-[#F84960] rounded animate-pulse"></div>
                  <span>Bear</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
                  <span>Live</span>
                </div>
              </div>
              
              {/* Mobile Instructions */}
              <div className={`absolute ${isMobile ? 'bottom-1 left-1' : 'bottom-2 left-2'} bg-black/90 rounded p-1.5 text-gray-400 text-xs max-w-[150px]`}>
                {isMobile ? 'Drag to pan • Pinch zoom' : 'Drag to pan • Controls to zoom'}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Market Stats */}
        {currentPrice && (
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-2 text-xs' : 'grid-cols-2 md:grid-cols-4 gap-3'}`}>
            <div className="bg-gray-800/60 p-2.5 rounded border border-gray-600 text-center">
              <p className="text-gray-400 mb-1 text-xs">24h High</p>
              <p className={`font-bold text-green-400 font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
                ${parseFloat(currentPrice.highPrice).toFixed(parseFloat(currentPrice.highPrice) > 1 ? 2 : 6)}
              </p>
            </div>
            <div className="bg-gray-800/60 p-2.5 rounded border border-gray-600 text-center">
              <p className="text-gray-400 mb-1 text-xs">24h Low</p>
              <p className={`font-bold text-red-400 font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
                ${parseFloat(currentPrice.lowPrice).toFixed(parseFloat(currentPrice.lowPrice) > 1 ? 2 : 6)}
              </p>
            </div>
            <div className="bg-gray-800/60 p-2.5 rounded border border-gray-600 text-center">
              <p className="text-gray-400 mb-1 text-xs">24h Volume</p>
              <p className={`font-bold text-white font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {(parseFloat(currentPrice.volume) / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-gray-800/60 p-2.5 rounded border border-gray-600 text-center">
              <p className="text-gray-400 mb-1 text-xs">Live Momentum</p>
              <p className={`font-bold text-blue-400 font-mono animate-pulse ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {maxMomentum.toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
