
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Bar } from 'recharts';
import { TrendingUp, TrendingDown, X, BarChart3, Activity, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLivePrices } from '@/hooks/useLivePrices';

interface EnhancedCryptoChartProps {
  symbol: string;
  name: string;
  onClose: () => void;
}

interface CandleData {
  timestamp: number;
  date: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  sma20?: number;
  sma50?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  candle?: 'bullish' | 'bearish';
  bodyHeight: number;
  bodyTop: number;
  upperWick: number;
  lowerWick: number;
}

export function EnhancedCryptoChart({ symbol, name, onClose }: EnhancedCryptoChartProps) {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [isLoading, setIsLoading] = useState(true);
  const [indicators, setIndicators] = useState({ 
    sma20: false, 
    sma50: false, 
    rsi: false, 
    macd: false,
    volume: true 
  });
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Get live prices for real momentum
  const { prices, getPrice } = useLivePrices();
  const livePrice = getPrice(symbol.replace('USDT', ''));

  const generateRealisticCandleData = (): CandleData[] => {
    console.log('Generating Binance-style candlestick data for', symbol);
    const data: CandleData[] = [];
    const now = Date.now();
    const intervals = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000 };
    const interval = intervals[timeframe as keyof typeof intervals] || 3600000;
    
    const basePrices: { [key: string]: number } = {
      'BTCUSDT': livePrice?.price || 95000,
      'ETHUSDT': livePrice?.price || 3500,
      'BNBUSDT': livePrice?.price || 650,
      'ADAUSDT': livePrice?.price || 0.45,
      'SOLUSDT': livePrice?.price || 180,
      'USDTUSDT': 1.0
    };
    
    let currentPrice = basePrices[symbol] || livePrice?.price || 100;
    
    for (let i = 100; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const date = new Date(timestamp);
      
      // Generate realistic OHLC with proper candle patterns
      const volatility = symbol.includes('BTC') ? 0.015 : 0.025;
      const trend = Math.sin(i / 15) * 0.003;
      const randomWalk = (Math.random() - 0.5) * volatility;
      
      const open = currentPrice;
      const priceChange = trend + randomWalk;
      const close = open * (1 + priceChange);
      
      // Create realistic high and low
      const range = Math.abs(close - open);
      const extraRange = range * (0.5 + Math.random() * 1.5);
      
      const high = Math.max(open, close) + extraRange * Math.random();
      const low = Math.min(open, close) - extraRange * Math.random();
      
      // Calculate candle body and wick data for proper rendering
      const bodyTop = Math.max(open, close);
      const bodyBottom = Math.min(open, close);
      const bodyHeight = Math.abs(close - open);
      const upperWick = high - bodyTop;
      const lowerWick = bodyBottom - low;
      
      data.push({
        timestamp: Math.floor(timestamp / 1000),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        open: Math.max(open, 0.001),
        high: Math.max(high, 0.001),
        low: Math.max(low, 0.001),
        close: Math.max(close, 0.001),
        volume: Math.random() * 5000000 + 1000000,
        candle: close > open ? 'bullish' as const : 'bearish' as const,
        bodyHeight,
        bodyTop,
        upperWick,
        lowerWick
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  const fetchChartData = async () => {
    console.log(`Loading chart data for ${symbol} with timeframe ${timeframe}`);
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockData = generateRealisticCandleData();
      setChartData(mockData);
      
    } catch (err) {
      console.error('Chart data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      
      const mockData = generateRealisticCandleData();
      setChartData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  const firstPrice = chartData[0]?.close || 0;
  const lastPrice = livePrice?.price || chartData[chartData.length - 1]?.close || 0;
  const priceChange = livePrice?.change || (lastPrice - firstPrice);
  const priceChangePercent = livePrice?.changePercent || (firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0);
  const isPositive = priceChange >= 0;
  const currentMomentum = livePrice?.momentum || Math.abs(priceChangePercent);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  };

  // Custom Candlestick component for Binance-style rendering
  const BinanceCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    
    if (!payload || typeof payload.open !== 'number') {
      return null;
    }

    const { open, high, low, close } = payload;
    const isBullish = close >= open;
    
    // Binance colors: Green for bullish, Red for bearish
    const color = isBullish ? '#0ecb81' : '#f6465d';
    
    // Calculate positions
    const candleWidth = Math.max(width * 0.7, 3);
    const wickWidth = 1;
    const centerX = x + width / 2;
    
    // Scale factor for price to pixel conversion
    const priceRange = high - low;
    const pixelRange = height;
    const scale = pixelRange / priceRange;
    
    // Calculate pixel positions
    const highY = y + (high - high) * scale; // Top of chart area
    const lowY = y + (high - low) * scale;   // Bottom of chart area
    const openY = y + (high - open) * scale;
    const closeY = y + (high - close) * scale;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

    return (
      <g>
        {/* Upper wick */}
        <line
          x1={centerX}
          x2={centerX}
          y1={highY}
          y2={bodyTop}
          stroke={color}
          strokeWidth={wickWidth}
        />
        
        {/* Lower wick */}
        <line
          x1={centerX}
          x2={centerX}
          y1={bodyBottom}
          y2={lowY}
          stroke={color}
          strokeWidth={wickWidth}
        />
        
        {/* Candle body */}
        <rect
          x={centerX - candleWidth / 2}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight}
          fill={isBullish ? color : color}
          fillOpacity={isBullish ? 0.1 : 1}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // Custom tooltip for better data display
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{data.time}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-mono">${data.open.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">High:</span>
              <span className="font-mono text-green-500">${data.high.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-mono text-red-500">${data.low.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-mono">${data.close.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-mono">{(data.volume / 1000000).toFixed(2)}M</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`w-full mx-auto transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50 max-w-none' : 'max-w-7xl'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <CardTitle className="text-xl sm:text-2xl font-bold">{symbol}</CardTitle>
            <Badge variant={isPositive ? 'default' : 'destructive'} className="px-2 sm:px-3 py-1">
              <div className="flex items-center gap-1">
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {priceChangePercent.toFixed(2)}%
              </div>
            </Badge>
            {livePrice && (
              <Badge variant="outline" className="text-green-600 border-green-300 animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:flex"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Price Display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-muted/20 to-muted/10 p-4 rounded-lg gap-3">
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono">${lastPrice.toFixed(lastPrice > 1 ? 2 : 6)}</p>
            <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-medium text-sm sm:text-base font-mono">
                {isPositive ? '+' : ''}${priceChange.toFixed(4)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="text-xs"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Line
            </Button>
            <Button
              variant={chartType === 'candle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candle')}
              className="text-xs"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Candle
            </Button>
          </div>
        </div>

        {/* Timeframe Controls */}
        <div className="flex flex-wrap gap-2">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className="text-xs"
            >
              {tf}
            </Button>
          ))}
        </div>

        {/* Main Chart */}
        {isLoading ? (
          <div className={`${isFullscreen ? 'h-[60vh]' : 'h-96'} flex items-center justify-center bg-muted/5 rounded-lg`}>
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className={`${isFullscreen ? 'h-[50vh]' : 'h-96'} w-full bg-black/5 rounded-lg p-2`}>
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
                  domain={['dataMin - 1%', 'dataMax + 1%']}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toFixed(value > 1 ? 0 : 3)}`}
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />
                
                {chartType === 'candle' ? (
                  <Bar 
                    dataKey="close" 
                    shape={<BinanceCandlestick />}
                  />
                ) : (
                  <Bar 
                    dataKey="close" 
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center bg-muted/5 rounded-lg">
            <div className="text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm mb-2">No chart data available</p>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
          </div>
        )}

        {/* Volume Chart */}
        {indicators.volume && chartData.length > 0 && (
          <div className="h-24 w-full">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              Volume
              <Badge variant="outline" className="text-xs">
                {(chartData[chartData.length - 1]?.volume / 1000000 || 0).toFixed(1)}M
              </Badge>
            </h4>
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
                <Bar dataKey="volume" opacity={0.6} radius={[1, 1, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#0ecb81' : '#f6465d'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Market Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-muted/10 to-muted/5 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">24h High</p>
            <p className="font-semibold text-sm text-green-600 font-mono">
              ${livePrice?.high24h?.toFixed(2) || Math.max(...chartData.map(d => d.high)).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">24h Low</p>
            <p className="font-semibold text-sm text-red-600 font-mono">
              ${livePrice?.low24h?.toFixed(2) || Math.min(...chartData.map(d => d.low)).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Volume</p>
            <p className="font-semibold text-sm font-mono">
              {livePrice?.volume ? (livePrice.volume / 1000000).toFixed(1) : (chartData[chartData.length - 1]?.volume / 1000000 || 0).toFixed(1)}M
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Change</p>
            <p className={`font-semibold text-sm font-mono flex items-center justify-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {priceChangePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
