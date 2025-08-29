
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, X, BarChart3, Activity, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

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
}

const CustomCandlestick = ({ payload, x, width, yScale }: any) => {
  if (!payload || !payload.open || !payload.high || !payload.low || !payload.close || !yScale) return null;
  
  const { open, high, low, close } = payload;
  const isGreen = close > open;
  const color = isGreen ? '#22c55e' : '#ef4444';
  
  const highY = yScale(high);
  const lowY = yScale(low);
  const openY = yScale(open);
  const closeY = yScale(close);
  
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY);
  const centerX = x + width / 2;
  
  return (
    <g>
      {/* High-Low line (wick) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Open-Close rectangle (body) */}
      <rect
        x={x + width * 0.2}
        y={bodyTop}
        width={width * 0.6}
        height={Math.max(bodyHeight, 1)}
        fill={isGreen ? color : 'transparent'}
        stroke={color}
        strokeWidth={1.5}
      />
    </g>
  );
};

export function EnhancedCryptoChart({ symbol, name, onClose }: EnhancedCryptoChartProps) {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [isLoading, setIsLoading] = useState(true);
  const [indicators, setIndicators] = useState({ 
    sma20: true, 
    sma50: true, 
    rsi: true, 
    macd: true, 
    volume: true 
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealChartData = async () => {
      console.log(`Fetching real chart data for ${symbol} with timeframe ${timeframe}`);
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: supabaseError } = await supabase.functions.invoke('taapi-proxy', {
          body: {
            symbol: symbol.replace('USDT', '/USDT'),
            exchange: 'binance',
            interval: timeframe,
            period: 100,
            indicators: ['rsi', 'sma', 'macd']
          }
        });

        if (supabaseError) {
          throw new Error(`Supabase error: ${supabaseError.message}`);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const { candles, indicators: indicatorData } = data;
        
        if (!candles || !Array.isArray(candles)) {
          throw new Error('Invalid candle data received');
        }

        const processedData: CandleData[] = candles.map((candle: any, index: number) => {
          const timestamp = new Date(candle.timestampHuman || candle.timestamp * 1000);
          
          return {
            timestamp: candle.timestamp,
            date: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
            volume: parseFloat(candle.volume || 0),
            rsi: indicatorData?.rsi?.[index]?.value || null,
            sma20: indicatorData?.sma?.[index]?.value || null,
            sma50: null, // Will calculate separately if needed
            macd: indicatorData?.macd?.[index]?.valueMACD || null,
            signal: indicatorData?.macd?.[index]?.valueMACDSignal || null
          };
        }).reverse(); // Reverse to show latest data on right

        console.log(`Processed ${processedData.length} real candles for ${symbol}`);
        setChartData(processedData);
        
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
        
        // Fallback to mock data if API fails
        const mockData = generateFallbackData();
        setChartData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealChartData();
  }, [symbol, timeframe]);

  const generateFallbackData = (): CandleData[] => {
    console.log('Generating fallback data due to API error');
    const data: CandleData[] = [];
    const now = Date.now();
    const intervals = { '1m': 60000, '5m': 300000, '1h': 3600000, '1d': 86400000 };
    const interval = intervals[timeframe as keyof typeof intervals] || 3600000;
    
    let currentPrice = Math.random() * 50000 + 20000;
    
    for (let i = 100; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const date = new Date(timestamp);
      
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility * 2;
      
      const open = currentPrice;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.015);
      const low = Math.min(open, close) * (1 - Math.random() * 0.015);
      
      data.push({
        timestamp: Math.floor(timestamp / 1000),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        open: Math.max(open, 0.01),
        high: Math.max(high, 0.01),
        low: Math.max(low, 0.01),
        close: Math.max(close, 0.01),
        volume: Math.random() * 1000000 + 100000,
        rsi: 30 + Math.random() * 40,
        sma20: close * (1 + (Math.random() - 0.5) * 0.02),
        macd: (Math.random() - 0.5) * 100
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  const firstPrice = chartData[0]?.close || 0;
  const lastPrice = chartData[chartData.length - 1]?.close || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <Card className="w-full max-w-7xl mx-auto">
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
            {error && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                Using fallback data
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Price Display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/20 p-3 sm:p-4 rounded-lg gap-3">
          <div>
            <p className="text-2xl sm:text-3xl font-bold">${lastPrice.toFixed(4)}</p>
            <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-medium text-sm sm:text-base">
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

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
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
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={indicators.sma20 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIndicators(prev => ({ ...prev, sma20: !prev.sma20 }))}
              className="text-xs"
            >
              SMA 20
            </Button>
            <Button
              variant={indicators.rsi ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIndicators(prev => ({ ...prev, rsi: !prev.rsi }))}
              className="text-xs"
            >
              RSI
            </Button>
            <Button
              variant={indicators.macd ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIndicators(prev => ({ ...prev, macd: !prev.macd }))}
              className="text-xs"
            >
              MACD
            </Button>
            <Button
              variant={indicators.volume ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIndicators(prev => ({ ...prev, volume: !prev.volume }))}
              className="text-xs"
            >
              Volume
            </Button>
          </div>
        </div>

        {/* Chart */}
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading real market data...</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="space-y-6">
            {/* Main Price Chart */}
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <XAxis 
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin - 50', 'dataMax + 50']}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'close') return [`$${value.toFixed(4)}`, 'Close'];
                      if (name === 'open') return [`$${value.toFixed(4)}`, 'Open'];
                      if (name === 'high') return [`$${value.toFixed(4)}`, 'High'];
                      if (name === 'low') return [`$${value.toFixed(4)}`, 'Low'];
                      if (name === 'sma20') return [`$${value.toFixed(4)}`, 'SMA 20'];
                      return [`${value.toFixed(4)}`, name];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  
                  {chartType === 'line' ? (
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    />
                  ) : (
                    // Candlestick rendering would need custom implementation
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={1}
                      dot={false}
                    />
                  )}
                  
                  {indicators.sma20 && (
                    <Line 
                      type="monotone" 
                      dataKey="sma20" 
                      stroke="#22c55e"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* RSI Chart */}
            {indicators.rsi && (
              <div className="h-32 w-full">
                <h4 className="text-sm font-medium mb-2">RSI (14)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis dataKey="time" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [`${value?.toFixed(2)}`, 'RSI']}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '10px' }}
                    />
                    <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    {/* RSI overbought/oversold lines */}
                    <Line type="monotone" dataKey={() => 70} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey={() => 30} stroke="#22c55e" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Volume Chart */}
            {indicators.volume && (
              <div className="h-24 w-full">
                <h4 className="text-sm font-medium mb-2">Volume</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis dataKey="time" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '10px' }}
                    />
                    <Bar dataKey="volume" opacity={0.6}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.close > entry.open ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">No chart data available</p>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
          </div>
        )}

        {/* Market Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/10 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">24h High</p>
            <p className="font-semibold text-xs sm:text-sm">${Math.max(...chartData.map(d => d.high)).toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">24h Low</p>
            <p className="font-semibold text-xs sm:text-sm">${Math.min(...chartData.map(d => d.low)).toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="font-semibold text-xs sm:text-sm">{(chartData[chartData.length - 1]?.volume / 1000000 || 0).toFixed(2)}M</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">RSI (14)</p>
            <p className={`font-semibold text-xs sm:text-sm ${
              (chartData[chartData.length - 1]?.rsi || 50) > 70 ? 'text-red-500' : 
              (chartData[chartData.length - 1]?.rsi || 50) < 30 ? 'text-green-500' : ''
            }`}>
              {(chartData[chartData.length - 1]?.rsi || 0).toFixed(1)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
