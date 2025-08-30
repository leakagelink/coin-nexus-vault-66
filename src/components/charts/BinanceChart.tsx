
import { useState, useEffect, useRef } from 'react';
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
  Loader2
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchChartData();
    }, 30000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get actual container dimensions
    const containerRect = container.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set canvas size based on container
    canvas.width = containerRect.width * devicePixelRatio;
    canvas.height = containerRect.height * devicePixelRatio;
    canvas.style.width = containerRect.width + 'px';
    canvas.style.height = containerRect.height + 'px';
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    const { width, height } = containerRect;
    ctx.clearRect(0, 0, width, height);

    // Mobile-optimized padding
    const padding = isMobile ? 40 : 80;
    const bottomPadding = isMobile ? 60 : 80; // Extra space for momentum bars
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding - bottomPadding;

    // Calculate price range
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) return;

    // Professional grid with mobile optimization
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines (fewer on mobile)
    const hLines = isMobile ? 6 : 10;
    for (let i = 0; i <= hLines; i++) {
      const y = padding + (chartHeight / hLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines (fewer on mobile)
    const vLines = isMobile ? 6 : 12;
    for (let i = 0; i <= vLines; i++) {
      const x = padding + (chartWidth / vLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - bottomPadding);
      ctx.stroke();
    }

    // Calculate candle dimensions
    const candleWidth = Math.max((chartWidth / chartData.length) * 0.8, isMobile ? 1.5 : 2);
    const candleSpacing = chartWidth / chartData.length;
    
    // Draw momentum bars first (background layer)
    const maxMomentum = Math.max(...chartData.map(c => c.momentum));
    chartData.forEach((candle, index) => {
      const x = padding + (index * candleSpacing) + candleSpacing / 2;
      
      if (candle.momentum > 5) { // Show momentum bars for significant momentum
        const momentumHeight = (candle.momentum / maxMomentum) * 40;
        const momentumY = height - bottomPadding + 10;
        
        // Momentum color based on candle direction and strength
        const momentumAlpha = Math.min(candle.momentum / 50, 0.8);
        const momentumColor = candle.isBullish 
          ? `rgba(2, 192, 118, ${momentumAlpha})` 
          : `rgba(248, 73, 96, ${momentumAlpha})`;
        
        ctx.fillStyle = momentumColor;
        ctx.fillRect(x - candleWidth/2, momentumY, candleWidth, momentumHeight);
        
        // Add glow effect for high momentum
        if (candle.momentum > 30) {
          ctx.shadowColor = candle.isBullish ? '#02C076' : '#F84960';
          ctx.shadowBlur = 3;
          ctx.fillRect(x - candleWidth/2, momentumY, candleWidth, momentumHeight);
          ctx.shadowBlur = 0;
        }
      }
    });
    
    // Draw candlesticks with enhanced momentum visualization
    chartData.forEach((candle, index) => {
      const x = padding + (index * candleSpacing) + candleSpacing / 2;
      
      // Binance-inspired colors
      const bullColor = '#02C076'; // Binance green
      const bearColor = '#F84960'; // Binance red
      const baseColor = candle.isBullish ? bullColor : bearColor;
      
      // Calculate positions
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      
      // Enhanced momentum glow effect
      if (candle.momentum > 20) {
        const glowRadius = Math.min(candle.momentum / 8, isMobile ? 6 : 8);
        const gradient = ctx.createRadialGradient(x, (openY + closeY) / 2, 0, x, (openY + closeY) / 2, glowRadius);
        gradient.addColorStop(0, baseColor + '60');
        gradient.addColorStop(1, baseColor + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, (openY + closeY) / 2, glowRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Draw wick with momentum-enhanced thickness
      const wickThickness = Math.max(0.8, 1 + (candle.momentum / 100) * (isMobile ? 1 : 2));
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = wickThickness;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw candle body with momentum enhancement
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      const enhancedWidth = candleWidth + (candle.momentum / 200) * (isMobile ? 2 : 4);
      
      ctx.fillStyle = baseColor;
      
      if (candle.isBullish) {
        // Bullish candle (outlined with momentum fill)
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = Math.max(1, candle.momentum / 40);
        ctx.strokeRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
        
        // Fill based on momentum strength
        if (candle.momentum > 15) {
          ctx.globalAlpha = Math.min(candle.momentum / 100, 0.4);
          ctx.fillRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
          ctx.globalAlpha = 1;
        }
      } else {
        // Bearish candle (filled with momentum intensity)
        ctx.globalAlpha = Math.max(0.7, Math.min(1, 0.7 + candle.momentum / 100));
        ctx.fillRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
        ctx.globalAlpha = 1;
      }
    });

    // Mobile-optimized price scale
    ctx.fillStyle = '#FFFFFF';
    ctx.font = isMobile ? '10px "Inter", system-ui, sans-serif' : '12px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'right';
    
    const priceLines = isMobile ? 6 : 10;
    for (let i = 0; i <= priceLines; i++) {
      const price = minPrice + (priceRange / priceLines) * i;
      const y = padding + chartHeight - (chartHeight / priceLines) * i;
      const priceText = price > 1 ? price.toFixed(2) : price.toFixed(6);
      
      // Compact price label for mobile
      const textWidth = ctx.measureText(`$${priceText}`).width;
      const labelPadding = isMobile ? 4 : 8;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(width - padding - textWidth - labelPadding - 2, y - (isMobile ? 6 : 8), 
                   textWidth + labelPadding, isMobile ? 12 : 16);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`$${priceText}`, width - padding - 2, y + (isMobile ? 2 : 4));
    }

    // Current price line with mobile optimization
    if (currentPrice) {
      const currentPriceNum = parseFloat(currentPrice.lastPrice);
      const currentPriceY = padding + ((maxPrice - currentPriceNum) / priceRange) * chartHeight;
      const isPositive = parseFloat(currentPrice.priceChangePercent) >= 0;
      
      // Animated price line
      ctx.strokeStyle = isPositive ? '#02C076' : '#F84960';
      ctx.lineWidth = isMobile ? 1.5 : 2;
      ctx.setLineDash([6, 3]);
      ctx.globalAlpha = 0.9;
      
      ctx.beginPath();
      ctx.moveTo(padding, currentPriceY);
      ctx.lineTo(width - padding, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Compact current price label for mobile
      const priceText = currentPriceNum > 1 ? currentPriceNum.toFixed(2) : currentPriceNum.toFixed(6);
      const labelWidth = isMobile ? 80 : 115;
      const labelHeight = isMobile ? 20 : 30;
      
      ctx.fillStyle = isPositive ? '#02C076' : '#F84960';
      ctx.fillRect(width - padding - labelWidth, currentPriceY - labelHeight/2, labelWidth, labelHeight);
      
      ctx.fillStyle = 'white';
      ctx.font = isMobile ? 'bold 9px "Inter", monospace' : 'bold 12px "Inter", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`$${priceText}`, width - padding - labelWidth/2, currentPriceY + (isMobile ? 2 : 4));
    }

    // Momentum indicator legend (mobile-optimized)
    if (maxMomentum > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      const legendWidth = isMobile ? 120 : 140;
      const legendHeight = isMobile ? 40 : 50;
      ctx.fillRect(padding, height - bottomPadding + 10, legendWidth, legendHeight);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isMobile ? '8px "Inter", system-ui, sans-serif' : '10px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Momentum', padding + 5, height - bottomPadding + (isMobile ? 22 : 28));
      ctx.fillText(`Max: ${maxMomentum.toFixed(0)}%`, padding + 5, height - bottomPadding + (isMobile ? 35 : 42));
    }
  };

  // Canvas setup and drawing with proper resize handling
  useEffect(() => {
    const resizeCanvas = () => {
      if (chartData.length > 0) {
        drawChart();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [chartData, currentPrice, isMobile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChartData();
  };

  // Statistics with momentum data
  const avgMomentum = chartData.length > 0 
    ? chartData.reduce((sum, c) => sum + c.momentum, 0) / chartData.length 
    : 0;
  const highMomentumCandles = chartData.filter(c => c.momentum > 30).length;
  const maxMomentum = chartData.length > 0 ? Math.max(...chartData.map(c => c.momentum)) : 0;

  // Dynamic height based on device
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
        {/* Mobile-optimized Price Info */}
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
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>Momentum Analysis</span>
                </div>
                <div className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <div>Avg: {avgMomentum.toFixed(1)}%</div>
                  <div>Max: {maxMomentum.toFixed(1)}%</div>
                  <div>High: {highMomentumCandles} candles</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-optimized Timeframe Selector */}
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
                <p className={isMobile ? 'text-base' : 'text-lg'}>Loading Professional Chart...</p>
                <p className={`text-gray-400 mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>Connecting to Binance API...</p>
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
                className="w-full h-full cursor-crosshair"
                style={{ imageRendering: 'auto', touchAction: 'manipulation' }}
              />
              
              {/* Mobile-optimized Legend */}
              <div className={`absolute top-2 left-2 bg-black/80 rounded p-2 text-white ${isMobile ? 'text-xs' : 'text-xs'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-2 bg-[#02C076] rounded"></div>
                  <span>Bullish</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-2 bg-[#F84960] rounded"></div>
                  <span>Bearish</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-2" />
                  <span>Momentum</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile-optimized Market Stats */}
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
