
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { TrendingUp, TrendingDown, X, BarChart3, Activity, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut, Settings, Move, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLivePrices } from '@/hooks/useLivePrices';
import { chartAPI, ChartData } from '@/services/chartApi';
import { CandlestickRenderer } from './candlestick-renderer';
import { ChartTooltip } from './chart-tooltip';
import { ChartIndicators, RSIChart } from './chart-indicators';

interface EnhancedCryptoChartProps {
  symbol: string;
  name: string;
  onClose: () => void;
}

export function EnhancedCryptoChart({ symbol, name, onClose }: EnhancedCryptoChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [chartOffset, setChartOffset] = useState({ x: 0, y: 0 });
  
  const [indicators, setIndicators] = useState({ 
    sma20: true, 
    sma50: true, 
    rsi: true, 
    macd: false,
    bollinger: false,
    volume: true 
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { prices, getPrice } = useLivePrices();
  const livePrice = getPrice(symbol.replace('USDT', ''));

  // Fetch real chart data
  const fetchChartData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching real chart data for ${symbol} with timeframe ${timeframe}`);
      const data = await chartAPI.getChartData(symbol, timeframe, 200);
      setChartData(data);
      console.log(`Loaded ${data.length} candles for ${symbol}`);
    } catch (err) {
      console.error('Chart data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  // Live price updates
  useEffect(() => {
    if (livePrice && chartData.length > 0) {
      setChartData(prevData => {
        const newData = [...prevData];
        const lastCandle = newData[newData.length - 1];
        if (lastCandle) {
          // Update the last candle with live price
          lastCandle.close = livePrice.price;
          lastCandle.high = Math.max(lastCandle.high, livePrice.price);
          lastCandle.low = Math.min(lastCandle.low, livePrice.price);
        }
        return newData;
      });
    }
  }, [livePrice, chartData.length]);

  // Chart manipulation handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - chartOffset.x, y: e.clientY - chartOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    setChartOffset(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.25, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.25, 0.25));
  };

  const resetChart = () => {
    setZoomLevel(1);
    setChartOffset({ x: 0, y: 0 });
  };

  // Calculate price statistics
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
        {/* Live Price Display */}
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
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              <BarChart3 className="h-3 w-3" />
              Candlestick
            </Button>
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
        </div>

        {/* Timeframe Controls */}
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className="text-xs min-w-[3rem] h-8"
            >
              {tf}
            </Button>
          ))}
        </div>

        {/* Indicators Settings */}
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

        {/* Main Chart */}
        <div className="relative">
          {isLoading ? (
            <div className={`${isFullscreen ? 'h-[60vh]' : 'h-96 sm:h-[500px]'} flex items-center justify-center bg-muted/5 rounded-lg border`}>
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <div 
              ref={chartContainerRef}
              className={`${isFullscreen ? 'h-[50vh]' : 'h-96 sm:h-[500px]'} w-full bg-background/50 rounded-lg border cursor-${isDragging ? 'grabbing' : 'grab'} overflow-hidden`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                transform: `translate(${chartOffset.x}px, ${chartOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="1 1" 
                    stroke="hsl(var(--muted-foreground))" 
                    opacity={0.1}
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="time"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin - 0.5%', 'dataMax + 0.5%']}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toFixed(value > 1 ? 0 : 4)}`}
                    orientation="right"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  
                  {/* Candlestick bars */}
                  <Bar 
                    dataKey="close" 
                    shape={<CandlestickRenderer />}
                  />

                  {/* Technical Indicators */}
                  <ChartIndicators data={chartData} indicators={indicators} />
                </ComposedChart>
              </ResponsiveContainer>
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

        {/* RSI Indicator */}
        {indicators.rsi && (
          <RSIChart data={chartData} isVisible={true} />
        )}

        {/* Volume Chart */}
        {indicators.volume && chartData.length > 0 && (
          <div className="h-24 w-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Volume</h4>
              <Badge variant="outline" className="text-xs">
                {(volume24h / 1000000).toFixed(1)}M
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis 
                  tick={{ fontSize: 9 }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  orientation="right"
                />
                <Tooltip 
                  formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '6px', 
                    fontSize: '11px' 
                  }}
                />
                <Bar dataKey="volume" opacity={0.6} radius={[1, 1, 0, 0]} fill="hsl(var(--primary))" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Market Stats */}
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
            <p className="font-semibold text-sm font-mono flex items-center justify-center gap-1">
              <Move className="h-3 w-3" />
              {zoomLevel.toFixed(1)}x
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
