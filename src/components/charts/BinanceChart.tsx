
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
  Loader2,
  RefreshCw,
  AlertCircle
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
  const [currentPrice, setCurrentPrice] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (!canvas || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Chart dimensions with proper padding
    const padding = 80;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate price range
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) return;

    // Draw professional grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 12; i++) {
      const x = padding + (chartWidth / 12) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Calculate candle dimensions
    const candleWidth = Math.max((chartWidth / chartData.length) * 0.7, 2);
    const candleSpacing = chartWidth / chartData.length;
    
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
      
      // Enhanced momentum visualization
      if (candle.momentum > 15) {
        // Glow effect for high momentum
        const glowRadius = Math.min(candle.momentum / 5, 10);
        const gradient = ctx.createRadialGradient(x, (openY + closeY) / 2, 0, x, (openY + closeY) / 2, glowRadius);
        gradient.addColorStop(0, baseColor + '40');
        gradient.addColorStop(1, baseColor + '00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - glowRadius, Math.min(openY, closeY) - glowRadius, 
                    glowRadius * 2, Math.abs(closeY - openY) + glowRadius * 2);
      }
      
      // Draw wick with momentum-based thickness
      const wickThickness = 1 + (candle.momentum / 50) * 2;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = wickThickness;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw candle body with momentum enhancement
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      const enhancedWidth = candleWidth + (candle.momentum / 100) * 3;
      
      ctx.fillStyle = baseColor;
      
      if (candle.isBullish) {
        // Bullish candle (outlined)
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = Math.max(1, candle.momentum / 30);
        ctx.strokeRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
        
        if (candle.momentum > 25) {
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
          ctx.globalAlpha = 1;
        }
      } else {
        // Bearish candle (filled)
        ctx.fillRect(x - enhancedWidth/2, bodyY, enhancedWidth, Math.max(bodyHeight, 1));
      }
      
      // Momentum bar at bottom
      if (candle.momentum > 20) {
        const momentumHeight = (candle.momentum / 100) * 25;
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x - candleWidth/2, height - padding - momentumHeight, 
                    candleWidth, momentumHeight);
        ctx.globalAlpha = 1;
      }
    });

    // Draw price scale
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 10; i++) {
      const price = minPrice + (priceRange / 10) * i;
      const y = padding + chartHeight - (chartHeight / 10) * i;
      const priceText = price > 1 ? price.toFixed(2) : price.toFixed(6);
      
      // Price label background
      const textWidth = ctx.measureText(`$${priceText}`).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(width - padding - textWidth - 10, y - 8, textWidth + 8, 16);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`$${priceText}`, width - padding - 5, y + 4);
    }

    // Current price line
    if (currentPrice) {
      const currentPriceNum = parseFloat(currentPrice.lastPrice);
      const currentPriceY = padding + ((maxPrice - currentPriceNum) / priceRange) * chartHeight;
      const isPositive = parseFloat(currentPrice.priceChangePercent) >= 0;
      
      // Animated price line
      ctx.strokeStyle = isPositive ? '#02C076' : '#F84960';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.globalAlpha = 0.9;
      
      ctx.beginPath();
      ctx.moveTo(padding, currentPriceY);
      ctx.lineTo(width - padding, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Current price label
      const priceText = currentPriceNum > 1 ? currentPriceNum.toFixed(2) : currentPriceNum.toFixed(6);
      ctx.fillStyle = isPositive ? '#02C076' : '#F84960';
      ctx.fillRect(width - padding - 120, currentPriceY - 15, 115, 30);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px "Inter", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`$${priceText}`, width - padding - 62, currentPriceY + 4);
    }
  };

  // Canvas setup and drawing
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      const devicePixelRatio = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }
      
      drawChart();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [chartData, currentPrice]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChartData();
  };

  // Statistics
  const avgMomentum = chartData.length > 0 
    ? chartData.reduce((sum, c) => sum + c.momentum, 0) / chartData.length 
    : 0;
  const highMomentumCandles = chartData.filter(c => c.momentum > 30).length;

  const chartHeight = isFullPage ? 'h-[80vh]' : 'h-[600px]';

  return (
    <Card className={`bg-gradient-to-br from-gray-900 to-black border-gray-700 ${isFullscreen ? 'fixed inset-4 z-50 max-w-none' : 'w-full'}`}>
      <CardHeader className="border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-2xl font-bold text-white">{symbol}</CardTitle>
            <Badge variant="outline" className="text-green-400 border-green-400 animate-pulse">
              LIVE
            </Badge>
            {currentPrice && (
              <Badge 
                variant={parseFloat(currentPrice.priceChangePercent) >= 0 ? 'default' : 'destructive'}
                className="px-3 py-1"
              >
                {parseFloat(currentPrice.priceChangePercent) >= 0 ? 
                  <TrendingUp className="h-4 w-4 mr-1" /> : 
                  <TrendingDown className="h-4 w-4 mr-1" />
                }
                {Math.abs(parseFloat(currentPrice.priceChangePercent)).toFixed(2)}%
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {!isFullPage && (
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
      
      <CardContent className="p-6 space-y-6">
        {/* Price Info */}
        {currentPrice && (
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-white font-mono">
                  ${parseFloat(currentPrice.lastPrice).toFixed(parseFloat(currentPrice.lastPrice) > 1 ? 2 : 6)}
                </div>
                <div className={`flex items-center gap-2 mt-2 ${parseFloat(currentPrice.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(currentPrice.priceChangePercent) >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="text-lg font-semibold">
                    {parseFloat(currentPrice.priceChangePercent) >= 0 ? '+' : ''}
                    ${parseFloat(currentPrice.priceChange).toFixed(4)} 
                    ({parseFloat(currentPrice.priceChangePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Activity className="h-5 w-5" />
                  <span className="text-sm">Momentum Analysis</span>
                </div>
                <div className="text-sm text-gray-300">
                  <div>Avg: {avgMomentum.toFixed(1)}%</div>
                  <div>High: {highMomentumCandles} candles</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe Selector */}
        <div className="flex gap-2 justify-center">
          {timeframes.map((tf) => (
            <Button
              key={tf.key}
              variant={timeframe === tf.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf.key)}
              className={timeframe === tf.key ? 'bg-blue-600 hover:bg-blue-700' : ''}
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
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-lg">Loading Professional Chart...</p>
                <p className="text-sm text-gray-400 mt-2">Connecting to Binance API...</p>
              </div>
            </div>
          ) : error ? (
            <div className={`${chartHeight} flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700`}>
              <div className="text-center text-white max-w-md">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-lg mb-2">Chart Loading Failed</p>
                <p className="text-sm text-red-400 mb-4">{error}</p>
                <p className="text-xs text-gray-500 mb-4">
                  The Binance proxy function may need to be deployed. Please check the Supabase dashboard.
                </p>
                <Button onClick={fetchChartData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>
            </div>
          ) : (
            <div className={`${chartHeight} bg-black rounded-lg border border-gray-700 overflow-hidden relative`}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                style={{ imageRendering: 'auto' }}
              />
              
              {/* Legend */}
              <div className="absolute top-4 left-4 bg-black/80 rounded p-3 text-xs text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-3 bg-[#02C076] rounded"></div>
                  <span>Bullish</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-3 bg-[#F84960] rounded"></div>
                  <span>Bearish</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-3" />
                  <span>Momentum</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Market Stats */}
        {currentPrice && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 p-4 rounded border border-gray-600 text-center">
              <p className="text-xs text-gray-400 mb-1">24h High</p>
              <p className="font-bold text-green-400 font-mono">
                ${parseFloat(currentPrice.highPrice).toFixed(parseFloat(currentPrice.highPrice) > 1 ? 2 : 6)}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded border border-gray-600 text-center">
              <p className="text-xs text-gray-400 mb-1">24h Low</p>
              <p className="font-bold text-red-400 font-mono">
                ${parseFloat(currentPrice.lowPrice).toFixed(parseFloat(currentPrice.lowPrice) > 1 ? 2 : 6)}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded border border-gray-600 text-center">
              <p className="text-xs text-gray-400 mb-1">24h Volume</p>
              <p className="font-bold text-white font-mono">
                {(parseFloat(currentPrice.volume) / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded border border-gray-600 text-center">
              <p className="text-xs text-gray-400 mb-1">Trades</p>
              <p className="font-bold text-blue-400 font-mono">
                {parseInt(currentPrice.count).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
