
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  Maximize2, 
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Activity,
  Loader2
} from 'lucide-react';
import { chartAPI, ChartData } from '@/services/chartApi';
import { useLivePrices } from '@/hooks/useLivePrices';

interface ProfessionalTradingChartProps {
  symbol: string;
  name: string;
  onClose: () => void;
}

interface CandleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: ChartData;
}

export function ProfessionalTradingChart({ symbol, name, onClose }: ProfessionalTradingChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [chartOffset, setChartOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: true,
    rsi: true,
    bollinger: false,
    volume: true,
    macd: false
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { prices, getPrice } = useLivePrices();
  const livePrice = getPrice(symbol.replace('USDT', ''));

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
      console.log(`Fetching professional chart data for ${symbol} with ${timeframe} timeframe`);
      const data = await chartAPI.getChartData(symbol, timeframe, 200);
      setChartData(data);
      console.log(`Loaded ${data.length} professional candles with momentum`);
    } catch (err) {
      console.error('Professional chart error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  // Live price updates with momentum
  useEffect(() => {
    if (livePrice && chartData.length > 0) {
      setChartData(prevData => {
        const newData = [...prevData];
        const lastCandle = newData[newData.length - 1];
        if (lastCandle) {
          lastCandle.close = livePrice.price;
          lastCandle.high = Math.max(lastCandle.high, livePrice.price);
          lastCandle.low = Math.min(lastCandle.low, livePrice.price);
        }
        return newData;
      });
    }
  }, [livePrice]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Chart dimensions
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Price range
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw candlesticks with momentum
    const candleWidth = Math.max(chartWidth / chartData.length - 2, 2);
    
    chartData.forEach((candle, index) => {
      const x = padding + (index * (chartWidth / chartData.length));
      const isBullish = candle.close >= candle.open;
      
      // Professional Binance colors
      const bullColor = '#0ecb81';
      const bearColor = '#f6465d';
      const color = isBullish ? bullColor : bearColor;
      
      // Calculate momentum intensity
      const momentum = Math.abs(candle.close - candle.open) / candle.open;
      const opacity = Math.min(0.3 + momentum * 20, 1);
      
      // Wick positions
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      
      // Draw high-low wick
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();
      
      // Draw candle body
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      
      if (isBullish) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, bodyY, candleWidth - 2, Math.max(bodyHeight, 2));
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, bodyY, candleWidth - 2, Math.max(bodyHeight, 2));
      }
      
      // Add momentum glow effect
      if (momentum > 0.02) {
        ctx.shadowColor = color;
        ctx.shadowBlur = momentum * 100;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, bodyY, candleWidth - 2, Math.max(bodyHeight, 2));
        ctx.shadowBlur = 0;
      }
    });

    ctx.globalAlpha = 1;

    // Draw indicators
    if (indicators.sma20 && chartData[0]?.sma20) {
      ctx.strokeStyle = '#ff9500';
      ctx.lineWidth = 2;
      ctx.beginPath();
      chartData.forEach((candle, index) => {
        if (candle.sma20) {
          const x = padding + (index * (chartWidth / chartData.length)) + candleWidth / 2;
          const y = padding + ((maxPrice - candle.sma20) / priceRange) * chartHeight;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    if (indicators.sma50 && chartData[0]?.sma50) {
      ctx.strokeStyle = '#007aff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      chartData.forEach((candle, index) => {
        if (candle.sma50) {
          const x = padding + (index * (chartWidth / chartData.length)) + candleWidth / 2;
          const y = padding + ((maxPrice - candle.sma50) / priceRange) * chartHeight;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw price labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange / 5) * i;
      const y = padding + chartHeight - (chartHeight / 5) * i;
      ctx.fillText(`$${price.toFixed(2)}`, width - padding - 10, y);
    }
  };

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth * zoomLevel;
      canvas.height = container.clientHeight * zoomLevel;
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
      
      drawChart();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [chartData, indicators, zoomLevel]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  const resetChart = () => {
    setZoomLevel(1);
    setChartOffset({ x: 0, y: 0 });
  };

  // Calculate statistics
  const firstPrice = chartData[0]?.close || 0;
  const lastPrice = livePrice?.price || chartData[chartData.length - 1]?.close || 0;
  const priceChange = livePrice?.change || (lastPrice - firstPrice);
  const priceChangePercent = livePrice?.changePercent || (firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0);
  const isPositive = priceChange >= 0;

  const high24h = livePrice?.high24h || Math.max(...chartData.map(d => d.high));
  const low24h = livePrice?.low24h || Math.min(...chartData.map(d => d.low));
  const volume24h = livePrice?.volume || chartData[chartData.length - 1]?.volume || 0;

  return (
    <Card className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50 max-w-none' : 'w-full max-w-7xl mx-auto'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-4 sm:px-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{symbol}</CardTitle>
            <Badge variant={isPositive ? 'default' : 'destructive'} className="px-2 py-1 flex items-center gap-1 whitespace-nowrap">
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {priceChangePercent.toFixed(2)}%
            </Badge>
            {livePrice && (
              <Badge variant="outline" className="text-green-600 border-green-300 animate-pulse whitespace-nowrap">
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{name}</p>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="h-8 w-8 sm:h-9 sm:w-9">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 sm:h-9 sm:w-9">
            <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 sm:h-9 sm:w-9">
            <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetChart} className="h-8 w-8 sm:h-9 sm:w-9">
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9"
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9">
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono">
                ${lastPrice.toFixed(lastPrice > 1 ? 2 : 6)}
              </p>
              {livePrice?.momentum && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Momentum: {livePrice.momentum.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className={`flex items-center gap-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-medium text-sm sm:text-base font-mono">
                {isPositive ? '+' : ''}${Math.abs(priceChange).toFixed(4)} ({priceChangePercent.toFixed(2)}%)
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

        {showSettings && (
          <div className="bg-muted/10 p-4 rounded-lg border">
            <h4 className="text-sm font-medium mb-3">Technical Indicators</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(indicators).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch 
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => 
                      setIndicators(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                  <Label htmlFor={key} className="text-xs font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          {isLoading ? (
            <div className={`${isFullscreen ? 'h-[60vh]' : 'h-96 sm:h-[500px]'} flex items-center justify-center bg-muted/5 rounded-lg border`}>
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading professional chart...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <div 
              className={`${isFullscreen ? 'h-[50vh]' : 'h-96 sm:h-[500px]'} w-full bg-background/50 rounded-lg border overflow-hidden relative`}
              style={{
                transform: `translate(${chartOffset.x}px, ${chartOffset.y}px)`,
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          ) : (
            <div className={`${isFullscreen ? 'h-[60vh]' : 'h-96'} flex items-center justify-center bg-muted/5 rounded-lg border`}>
              <div className="text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm mb-2">No chart data available</p>
                {error && <p className="text-red-500 text-xs">{error}</p>}
              </div>
            </div>
          )}
        </div>

        {indicators.rsi && chartData.length > 0 && (
          <div className="h-32 w-full bg-background/50 rounded-lg border p-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">RSI (14)</h4>
              <span className="text-xs text-muted-foreground font-mono">
                {chartData[chartData.length - 1]?.rsi?.toFixed(1) || '50.0'}
              </span>
            </div>
            <div className="h-20 relative bg-muted/20 rounded">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-red-500/30 absolute top-4" />
                <div className="w-full h-px bg-green-500/30 absolute bottom-4" />
              </div>
              <svg className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  points={chartData.map((item, index) => 
                    `${(index / (chartData.length - 1)) * 100}%,${100 - (item.rsi || 50)}%`
                  ).join(' ')}
                />
              </svg>
            </div>
          </div>
        )}

        {indicators.volume && chartData.length > 0 && (
          <div className="h-24 w-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Volume</h4>
              <Badge variant="outline" className="text-xs">
                {(volume24h / 1000000).toFixed(1)}M
              </Badge>
            </div>
            <div className="h-16 bg-muted/20 rounded flex items-end">
              {chartData.map((candle, index) => (
                <div
                  key={index}
                  className="bg-primary/60 rounded-t"
                  style={{
                    width: `${100 / chartData.length}%`,
                    height: `${Math.min((candle.volume / Math.max(...chartData.map(d => d.volume))) * 100, 100)}%`,
                    marginRight: '1px'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-muted/10 to-muted/5 rounded-lg border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">24h High</p>
            <p className="font-semibold text-sm text-green-600 font-mono">
              ${high24h.toFixed(lastPrice > 1 ? 2 : 6)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">24h Low</p>
            <p className="font-semibold text-sm text-red-600 font-mono">
              ${low24h.toFixed(lastPrice > 1 ? 2 : 6)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Volume</p>
            <p className="font-semibold text-sm font-mono">
              {(volume24h / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Zoom</p>
            <p className="font-semibold text-sm font-mono">
              {zoomLevel.toFixed(1)}x
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
