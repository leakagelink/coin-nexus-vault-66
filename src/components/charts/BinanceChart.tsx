
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Loader2
} from 'lucide-react';
import { binanceService, ProcessedCandle } from '@/services/binanceService';

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPrice, setCurrentPrice] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const timeframes = [
    { key: '1m', label: '1m' },
    { key: '5m', label: '5m' },
    { key: '15m', label: '15m' },
    { key: '1h', label: '1h' },
    { key: '4h', label: '4h' },
    { key: '1d', label: '1d' }
  ];

  const fetchChartData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching Binance data for ${symbol} with ${timeframe} timeframe`);
      const [candleData, priceData] = await Promise.all([
        binanceService.getKlines(symbol, timeframe, 200),
        binanceService.getCurrentPrice(symbol)
      ]);
      
      setChartData(candleData);
      setCurrentPrice(priceData);
      console.log(`Loaded ${candleData.length} candles with momentum data`);
    } catch (err) {
      console.error('Binance chart error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  // Auto-refresh every 30 seconds for live data
  useEffect(() => {
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Chart dimensions
    const padding = isFullPage ? 80 : 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Price range
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw Binance-style grid
    ctx.strokeStyle = 'rgba(43, 43, 43, 0.3)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = padding + (chartHeight / 8) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Calculate candle width
    const candleWidth = Math.max((chartWidth / chartData.length) - 2, 1);
    const candleSpacing = chartWidth / chartData.length;
    
    // Draw candlesticks with momentum
    chartData.forEach((candle, index) => {
      const x = padding + (index * candleSpacing);
      
      // Binance colors
      const bullColor = '#0ECB81'; // Binance green
      const bearColor = '#F6465D'; // Binance red
      const baseColor = candle.isBullish ? bullColor : bearColor;
      
      // Momentum intensity (0 to 1)
      const momentumIntensity = Math.min(candle.momentum / 50, 1);
      
      // Calculate positions
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      
      // Draw momentum glow effect for high momentum candles
      if (candle.momentum > 20) {
        const glowIntensity = Math.min(candle.momentum / 10, 15);
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = glowIntensity;
        ctx.globalAlpha = 0.6;
        
        const bodyHeight = Math.abs(closeY - openY);
        const bodyY = Math.min(openY, closeY);
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(x - 1, bodyY, candleWidth + 2, Math.max(bodyHeight, 2));
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      
      // Draw high-low wick
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = Math.max(1, momentumIntensity * 3);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();
      
      // Draw candle body
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      const enhancedWidth = candleWidth + (momentumIntensity * 2);
      const widthOffset = (enhancedWidth - candleWidth) / 2;
      
      ctx.globalAlpha = 1;
      
      if (candle.isBullish) {
        // Bullish candle (hollow)
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1 + momentumIntensity;
        ctx.strokeRect(x - widthOffset, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
        
        if (candle.momentum > 15) {
          ctx.fillStyle = baseColor;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x - widthOffset, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
        }
      } else {
        // Bearish candle (filled)
        ctx.fillStyle = baseColor;
        ctx.fillRect(x - widthOffset, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
      }
      
      // Momentum indicator at bottom
      if (candle.momentum > 25) {
        const momentumBarHeight = (candle.momentum / 100) * 15;
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x, height - padding - momentumBarHeight, candleWidth, momentumBarHeight);
      }
    });

    ctx.globalAlpha = 1;

    // Draw price labels
    ctx.fillStyle = '#F0F0F0';
    ctx.font = `${isFullPage ? '12px' : '10px'} 'SF Pro Display', system-ui, sans-serif`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 8; i++) {
      const price = minPrice + (priceRange / 8) * i;
      const y = padding + chartHeight - (chartHeight / 8) * i;
      const priceText = price > 1 ? price.toFixed(2) : price.toFixed(6);
      ctx.fillText(`$${priceText}`, width - padding - 5, y + 4);
    }

    // Current price line
    if (currentPrice) {
      const currentPriceNum = parseFloat(currentPrice.lastPrice);
      const currentPriceY = padding + ((maxPrice - currentPriceNum) / priceRange) * chartHeight;
      const isPositive = parseFloat(currentPrice.priceChangePercent) >= 0;
      
      ctx.strokeStyle = isPositive ? '#0ECB81' : '#F6465D';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(padding, currentPriceY);
      ctx.lineTo(width - padding, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Price label
      ctx.fillStyle = isPositive ? '#0ECB81' : '#F6465D';
      ctx.textAlign = 'left';
      const priceText = currentPriceNum > 1 ? currentPriceNum.toFixed(2) : currentPriceNum.toFixed(6);
      ctx.fillRect(width - padding - 100, currentPriceY - 12, 95, 24);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`$${priceText}`, width - padding - 95, currentPriceY + 3);
    }
  };

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      const devicePixelRatio = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width * devicePixelRatio * zoomLevel;
      canvas.height = rect.height * devicePixelRatio * zoomLevel;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(devicePixelRatio * zoomLevel, devicePixelRatio * zoomLevel);
      }
      
      drawChart();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [chartData, zoomLevel, currentPrice]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  const resetChart = () => setZoomLevel(1);

  // Statistics
  const lastCandle = chartData[chartData.length - 1];
  const avgMomentum = chartData.reduce((sum, c) => sum + c.momentum, 0) / chartData.length;
  const highMomentumCandles = chartData.filter(c => c.momentum > 30).length;

  const chartHeight = isFullPage ? 'h-[75vh]' : 'h-96 sm:h-[500px]';

  return (
    <Card className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50 max-w-none' : 'w-full max-w-7xl mx-auto'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-4 sm:px-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{symbol}</CardTitle>
            {currentPrice && (
              <>
                <Badge variant={parseFloat(currentPrice.priceChangePercent) >= 0 ? 'default' : 'destructive'} 
                       className="px-2 py-1 flex items-center gap-1 whitespace-nowrap">
                  {parseFloat(currentPrice.priceChangePercent) >= 0 ? 
                    <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(parseFloat(currentPrice.priceChangePercent)).toFixed(2)}%
                </Badge>
                <Badge variant="outline" className="text-green-600 border-green-300 animate-pulse whitespace-nowrap">
                  LIVE
                </Badge>
              </>
            )}
            {avgMomentum > 20 && (
              <Badge variant="outline" className="text-blue-600 border-blue-300 whitespace-nowrap">
                <Activity className="h-3 w-3 mr-1" />
                High Momentum
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{name}</p>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 sm:h-9 sm:w-9">
            <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 sm:h-9 sm:w-9">
            <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetChart} className="h-8 w-8 sm:h-9 sm:w-9">
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          {!isFullPage && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9"
            >
              {isFullscreen ? <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />}
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9">
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 px-4 sm:px-6">
        {currentPrice && (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono">
                  ${parseFloat(currentPrice.lastPrice).toFixed(parseFloat(currentPrice.lastPrice) > 1 ? 2 : 6)}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Avg Momentum: {avgMomentum.toFixed(1)}%</span>
                  <span>({highMomentumCandles} high)</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${parseFloat(currentPrice.priceChangePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(currentPrice.priceChangePercent) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium text-sm sm:text-base font-mono">
                  {parseFloat(currentPrice.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(currentPrice.priceChange).toFixed(4)} 
                  ({parseFloat(currentPrice.priceChangePercent).toFixed(2)}%)
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchChartData}
              className="flex items-center gap-1 text-xs"
            >
              <Activity className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {timeframes.map((tf) => (
            <Button
              key={tf.key}
              variant={timeframe === tf.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf.key)}
              className="text-xs min-w-[3rem] h-8"
            >
              {tf.label}
            </Button>
          ))}
        </div>

        <div className="relative">
          {isLoading ? (
            <div className={`${chartHeight} flex items-center justify-center bg-muted/5 rounded-lg border`}>
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading Binance chart with momentum...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <div className={`${chartHeight} w-full bg-[#0B0E11] rounded-lg border overflow-hidden relative`}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                style={{ imageRendering: 'auto' }}
              />
              <div className="absolute top-2 left-2 bg-black/80 rounded p-2 text-xs text-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-[#0ECB81] rounded"></div>
                  <span>Bullish</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-[#F6465D] rounded"></div>
                  <span>Bearish</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  <span>Momentum glow</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${chartHeight} flex items-center justify-center bg-muted/5 rounded-lg border`}>
              <div className="text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm mb-2">No chart data available</p>
                {error && <p className="text-red-500 text-xs">{error}</p>}
              </div>
            </div>
          )}
        </div>

        {currentPrice && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-muted/10 to-muted/5 rounded-lg border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">24h High</p>
              <p className="font-semibold text-sm text-green-600 font-mono">
                ${parseFloat(currentPrice.highPrice).toFixed(parseFloat(currentPrice.highPrice) > 1 ? 2 : 6)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">24h Low</p>
              <p className="font-semibold text-sm text-red-600 font-mono">
                ${parseFloat(currentPrice.lowPrice).toFixed(parseFloat(currentPrice.lowPrice) > 1 ? 2 : 6)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
              <p className="font-semibold text-sm font-mono">
                {(parseFloat(currentPrice.volume) / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Zoom</p>
              <p className="font-semibold text-sm font-mono">
                {zoomLevel.toFixed(1)}x
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
