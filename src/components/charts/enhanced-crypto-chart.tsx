
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Bar, Line, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, X, BarChart3, Activity, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLivePrices } from '@/hooks/useLivePrices';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  const [showSettings, setShowSettings] = useState(false);

  // Get live prices for real momentum
  const { prices, getPrice } = useLivePrices();
  const livePrice = getPrice(symbol.replace('USDT', ''));

  // Calculate technical indicators
  const calculateSMA = (data: CandleData[], period: number): number[] => {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(0);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  const calculateRSI = (data: CandleData[], period: number = 14): number[] => {
    const rsi = [];
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        rsi.push(50);
      } else {
        const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const rs = avgGain / (avgLoss || 1);
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    return rsi;
  };

  const generateRealisticCandleData = (): CandleData[] => {
    console.log('Generating enhanced candlestick data for', symbol);
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
    
    // Add technical indicators
    if (indicators.sma20) {
      const sma20 = calculateSMA(data, 20);
      data.forEach((item, index) => {
        item.sma20 = sma20[index] || 0;
      });
    }
    
    if (indicators.sma50) {
      const sma50 = calculateSMA(data, 50);
      data.forEach((item, index) => {
        item.sma50 = sma50[index] || 0;
      });
    }
    
    if (indicators.rsi) {
      const rsi = calculateRSI(data);
      data.forEach((item, index) => {
        item.rsi = rsi[index] || 50;
      });
    }
    
    return data;
  };

  const fetchChartData = async () => {
    console.log(`Loading chart data for ${symbol} with timeframe ${timeframe}`);
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
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
  }, [symbol, timeframe, indicators]);

  const firstPrice = chartData[0]?.close || 0;
  const lastPrice = livePrice?.price || chartData[chartData.length - 1]?.close || 0;
  const priceChange = livePrice?.change || (lastPrice - firstPrice);
  const priceChangePercent = livePrice?.changePercent || (firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0);
  const isPositive = priceChange >= 0;

  // Enhanced Candlestick component with proper rendering
  const EnhancedCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    
    if (!payload || typeof payload.open !== 'number') {
      return null;
    }

    const { open, high, low, close } = payload;
    const isBullish = close >= open;
    
    // Professional Binance-style colors
    const bullishColor = '#0ecb81';
    const bearishColor = '#f6465d';
    const color = isBullish ? bullishColor : bearishColor;
    
    // Calculate dimensions
    const candleWidth = Math.max(width * 0.8, 4);
    const wickWidth = 1.5;
    const centerX = x + width / 2;
    
    // Price range calculations
    const priceRange = high - low;
    if (priceRange === 0) return null;
    
    const pixelRange = height;
    const scale = pixelRange / priceRange;
    
    // Calculate pixel positions
    const highY = y;
    const lowY = y + height;
    const openY = y + ((high - open) / priceRange) * height;
    const closeY = y + ((high - close) / priceRange) * height;
    
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
          fill={isBullish ? 'transparent' : color}
          stroke={color}
          strokeWidth={1.5}
        />
      </g>
    );
  };

  // Professional tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium mb-2 text-foreground">{data.time}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-mono text-foreground">${data.open.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">High:</span>
              <span className="font-mono text-green-500">${data.high.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-mono text-red-500">${data.low.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-mono text-foreground">${data.close.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-mono text-muted-foreground">{(data.volume / 1000000).toFixed(2)}M</span>
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
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <CardTitle className="text-xl sm:text-2xl font-bold">{symbol}</CardTitle>
            <Badge variant={isPositive ? 'default' : 'destructive'} className="px-2 sm:px-3 py-1 flex items-center gap-1">
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {priceChangePercent.toFixed(2)}%
            </Badge>
            {livePrice && (
              <Badge variant="outline" className="text-green-600 border-green-300 animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{name}</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoomLevel(prev => Math.min(prev * 1.2, 3))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoomLevel(prev => Math.max(prev / 1.2, 0.5))}>
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
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="text-xs flex items-center gap-1"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              Line
            </Button>
            <Button
              variant={chartType === 'candle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candle')}
              className="text-xs flex items-center gap-1"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              Candle
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
              className="text-xs min-w-[3rem]"
            >
              {tf}
            </Button>
          ))}
        </div>

        {/* Indicators Settings */}
        {showSettings && (
          <div className="bg-muted/10 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Technical Indicators</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="sma20" 
                  checked={indicators.sma20}
                  onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, sma20: checked }))}
                />
                <Label htmlFor="sma20" className="text-xs">SMA 20</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="sma50" 
                  checked={indicators.sma50}
                  onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, sma50: checked }))}
                />
                <Label htmlFor="sma50" className="text-xs">SMA 50</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="rsi" 
                  checked={indicators.rsi}
                  onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, rsi: checked }))}
                />
                <Label htmlFor="rsi" className="text-xs">RSI</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="volume" 
                  checked={indicators.volume}
                  onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, volume: checked }))}
                />
                <Label htmlFor="volume" className="text-xs">Volume</Label>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        {isLoading ? (
          <div className={`${isFullscreen ? 'h-[60vh]' : 'h-96'} flex items-center justify-center bg-muted/5 rounded-lg`}>
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className={`${isFullscreen ? 'h-[50vh]' : 'h-96'} w-full bg-card/50 rounded-lg p-2 border`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="2 2" 
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
                    shape={<EnhancedCandlestick />}
                  />
                ) : (
                  <Line 
                    type="monotone"
                    dataKey="close"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                )}

                {/* Technical Indicators */}
                {indicators.sma20 && (
                  <Line 
                    type="monotone"
                    dataKey="sma20"
                    stroke="#ff6b6b"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="3 3"
                  />
                )}
                
                {indicators.sma50 && (
                  <Line 
                    type="monotone"
                    dataKey="sma50"
                    stroke="#4ecdc4"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="5 5"
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

        {/* RSI Indicator */}
        {indicators.rsi && chartData.length > 0 && (
          <div className="h-24 w-full">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              RSI (14)
              <Badge variant="outline" className="text-xs">
                {chartData[chartData.length - 1]?.rsi?.toFixed(1) || '50.0'}
              </Badge>
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 9 }} 
                  tickLine={false} 
                  axisLine={false}
                  orientation="right"
                />
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(1)}`, 'RSI']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '6px', 
                    fontSize: '11px' 
                  }}
                />
                <ReferenceLine y={70} stroke="#f6465d" strokeDasharray="2 2" opacity={0.5} />
                <ReferenceLine y={30} stroke="#0ecb81" strokeDasharray="2 2" opacity={0.5} />
                <Line 
                  type="monotone"
                  dataKey="rsi" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
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
                <Bar dataKey="volume" opacity={0.7} radius={[1, 1, 0, 0]}>
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
