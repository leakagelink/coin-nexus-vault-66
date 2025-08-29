
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, X, BarChart3, Activity, Loader2, Maximize2, Minimize2 } from 'lucide-react';
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
  histogram?: number;
}

export function EnhancedCryptoChart({ symbol, name, onClose }: EnhancedCryptoChartProps) {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [isLoading, setIsLoading] = useState(true);
  const [indicators, setIndicators] = useState({ 
    sma20: true, 
    sma50: false, 
    rsi: false, 
    macd: false,
    volume: true 
  });
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const generateRealisticMockData = (): CandleData[] => {
    console.log('Generating realistic mock data for', symbol);
    const data: CandleData[] = [];
    const now = Date.now();
    const intervals = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000 };
    const interval = intervals[timeframe as keyof typeof intervals] || 3600000;
    
    // Base prices for different cryptos
    const basePrices: { [key: string]: number } = {
      'BTCUSDT': 95000,
      'ETHUSDT': 3500,
      'BNBUSDT': 650,
      'ADAUSDT': 0.45,
      'SOLUSDT': 180,
      'USDTUSDT': 1.0
    };
    
    let currentPrice = basePrices[symbol] || 100;
    const sma20Array: number[] = [];
    const sma50Array: number[] = [];
    
    for (let i = 100; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const date = new Date(timestamp);
      
      // More realistic price movement with trends
      const volatility = symbol.includes('BTC') ? 0.02 : 0.03;
      const trend = Math.sin(i / 15) * 0.002; // Longer trend cycles
      const randomWalk = (Math.random() - 0.5) * volatility;
      const change = trend + randomWalk;
      
      const open = currentPrice;
      const close = open * (1 + change);
      
      // Realistic high/low with wicks
      const wickRange = Math.abs(open - close) * (1 + Math.random());
      const high = Math.max(open, close) + wickRange * Math.random();
      const low = Math.min(open, close) - wickRange * Math.random();
      
      sma20Array.push(close);
      sma50Array.push(close);
      
      if (sma20Array.length > 20) sma20Array.shift();
      if (sma50Array.length > 50) sma50Array.shift();
      
      const sma20 = sma20Array.reduce((a, b) => a + b, 0) / sma20Array.length;
      const sma50 = sma50Array.reduce((a, b) => a + b, 0) / sma50Array.length;
      
      // RSI calculation (simplified but more realistic)
      const priceChanges = sma20Array.slice(-14).map((price, idx, arr) => 
        idx > 0 ? price - arr[idx - 1] : 0
      ).slice(1);
      const gains = priceChanges.filter(change => change > 0);
      const losses = priceChanges.filter(change => change < 0).map(loss => Math.abs(loss));
      const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
      const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0.01;
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      // MACD calculation
      const ema12 = sma20 * 0.7 + close * 0.3; // Simplified EMA
      const ema26 = sma50 * 0.8 + close * 0.2;
      const macd = ema12 - ema26;
      const signal = macd * 0.9; // Simplified signal line
      const histogram = macd - signal;
      
      data.push({
        timestamp: Math.floor(timestamp / 1000),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        open: Math.max(open, 0.01),
        high: Math.max(high, 0.01),
        low: Math.max(low, 0.01),
        close: Math.max(close, 0.01),
        volume: Math.random() * 2000000 + 500000,
        rsi: Math.max(0, Math.min(100, rsi)),
        sma20,
        sma50,
        macd,
        signal,
        histogram
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  useEffect(() => {
    const fetchChartData = async () => {
      console.log(`Fetching chart data for ${symbol} with timeframe ${timeframe}`);
      setIsLoading(true);
      setError(null);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const { data, error: supabaseError } = await supabase.functions.invoke('taapi-proxy', {
          body: {
            symbol: symbol.replace('USDT', '/USDT'),
            exchange: 'binance',
            interval: timeframe,
            period: 100,
            indicators: ['rsi', 'sma', 'macd']
          }
        });

        if (supabaseError || data?.error) {
          throw new Error('API service temporarily unavailable');
        }

        const { candles, indicators: indicatorData } = data;
        
        if (!candles || !Array.isArray(candles) || candles.length === 0) {
          throw new Error('No market data available');
        }

        console.log(`Processing ${candles.length} candles from TaapiAPI`);
        
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
            macd: indicatorData?.macd?.[index]?.valueMACD || null,
            signal: indicatorData?.macd?.[index]?.valueMACDSignal || null,
            histogram: indicatorData?.macd?.[index]?.valueMACD - indicatorData?.macd?.[index]?.valueMACDSignal || null
          };
        }).reverse();

        setChartData(processedData);
        
      } catch (err) {
        console.error('Chart data error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
        
        // Generate high-quality mock data as fallback
        const mockData = generateRealisticMockData();
        setChartData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, timeframe]);

  const firstPrice = chartData[0]?.close || 0;
  const lastPrice = chartData[chartData.length - 1]?.close || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

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
            {error && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                Demo Data
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{name}</p>
        </div>
        <div className="flex items-center gap-2">
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
            <p className="text-3xl sm:text-4xl font-bold">${lastPrice.toFixed(lastPrice > 1 ? 2 : 4)}</p>
            <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-medium text-sm sm:text-base">
                {isPositive ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
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
              variant={indicators.volume ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIndicators(prev => ({ ...prev, volume: !prev.volume }))}
              className="text-xs"
            >
              Volume
            </Button>
          </div>
        </div>

        {/* Chart Container */}
        {isLoading ? (
          <div className={`${isFullscreen ? 'h-[60vh]' : 'h-96'} flex items-center justify-center bg-muted/5 rounded-lg`}>
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading professional chart data...</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="space-y-6">
            {/* Main Price Chart */}
            <div className={`${isFullscreen ? 'h-[50vh]' : 'h-96'} w-full bg-gradient-to-b from-background to-muted/5 rounded-lg p-4`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="hsl(var(--muted-foreground))" 
                    opacity={0.2}
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="time"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin - 1%', 'dataMax + 1%']}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toFixed(value > 1 ? 0 : 2)}`}
                    orientation="right"
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'close') return [`$${value.toFixed(4)}`, 'Price'];
                      if (name === 'sma20') return [`$${value.toFixed(4)}`, 'SMA 20'];
                      return [`${value.toFixed(4)}`, name];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  
                  {chartType === 'line' ? (
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    />
                  ) : (
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
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Volume Chart */}
            {indicators.volume && (
              <div className="h-20 w-full">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  Volume
                  <Badge variant="outline" className="text-xs">
                    {(chartData[chartData.length - 1]?.volume / 1000000 || 0).toFixed(1)}M
                  </Badge>
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
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
                        <Cell key={`cell-${index}`} fill={entry.close > entry.open ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* RSI Chart */}
            {indicators.rsi && (
              <div className="h-24 w-full">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  RSI (14)
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      (chartData[chartData.length - 1]?.rsi || 50) > 70 ? 'border-red-300 text-red-600' : 
                      (chartData[chartData.length - 1]?.rsi || 50) < 30 ? 'border-green-300 text-green-600' : 
                      'border-gray-300 text-gray-600'
                    }`}
                  >
                    {(chartData[chartData.length - 1]?.rsi || 0).toFixed(1)}
                  </Badge>
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 9 }} 
                      tickLine={false} 
                      axisLine={false}
                      orientation="right"
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value?.toFixed(1)}`, 'RSI']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        fontSize: '10px' 
                      }}
                    />
                    <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    {/* RSI reference lines */}
                    <Line type="monotone" dataKey={() => 70} stroke="#ef4444" strokeWidth={1} strokeDasharray="2 2" dot={false} />
                    <Line type="monotone" dataKey={() => 30} stroke="#22c55e" strokeWidth={1} strokeDasharray="2 2" dot={false} />
                    <Line type="monotone" dataKey={() => 50} stroke="#6b7280" strokeWidth={1} strokeDasharray="1 1" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
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

        {/* Market Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-gradient-to-r from-muted/10 to-muted/5 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">24h High</p>
            <p className="font-semibold text-sm text-green-600">
              ${Math.max(...chartData.map(d => d.high)).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">24h Low</p>
            <p className="font-semibold text-sm text-red-600">
              ${Math.min(...chartData.map(d => d.low)).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Volume</p>
            <p className="font-semibold text-sm">
              {(chartData[chartData.length - 1]?.volume / 1000000 || 0).toFixed(1)}M
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">RSI (14)</p>
            <p className={`font-semibold text-sm ${
              (chartData[chartData.length - 1]?.rsi || 50) > 70 ? 'text-red-500' : 
              (chartData[chartData.length - 1]?.rsi || 50) < 30 ? 'text-green-500' : 
              'text-muted-foreground'
            }`}>
              {(chartData[chartData.length - 1]?.rsi || 0).toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Change</p>
            <p className={`font-semibold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {priceChangePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
