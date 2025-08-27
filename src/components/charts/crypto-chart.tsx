
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, X, BarChart3, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CryptoChartProps {
  symbol: string;
  name: string;
  onClose: () => void;
}

interface CandleData {
  timestamp: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20: number;
  sma50: number;
}

const CustomCandlestick = ({ payload, x, width }: any) => {
  if (!payload || !payload.open || !payload.high || !payload.low || !payload.close) return null;
  
  const { open, high, low, close } = payload;
  const isGreen = close > open;
  const color = isGreen ? '#22c55e' : '#ef4444';
  const bodyHeight = Math.abs(close - open);
  const bodyY = Math.min(close, open);
  const centerX = x + width / 2;
  
  return (
    <g>
      {/* High-Low line (wick) */}
      <line
        x1={centerX}
        y1={high}
        x2={centerX}
        y2={low}
        stroke={color}
        strokeWidth={1}
      />
      {/* Open-Close rectangle (body) */}
      <rect
        x={x + width * 0.25}
        y={bodyY}
        width={width * 0.5}
        height={Math.max(bodyHeight, 1)}
        fill={isGreen ? color : 'transparent'}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export function CryptoChart({ symbol, name, onClose }: CryptoChartProps) {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [isLoading, setIsLoading] = useState(true);
  const [indicators, setIndicators] = useState({ sma20: true, sma50: true, volume: true });

  const generateCandleData = (days: number) => {
    const data: CandleData[] = [];
    const now = new Date();
    const basePrice = Math.random() * 50000 + 10000;
    let currentPrice = basePrice;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      const open = currentPrice;
      const volatility = 0.05;
      const change = (Math.random() - 0.5) * volatility * 2;
      const close = open * (1 + change);
      
      const high = Math.max(open, close) * (1 + Math.random() * 0.03);
      const low = Math.min(open, close) * (1 - Math.random() * 0.03);
      
      const volume = Math.random() * 1000000 + 100000;
      const sma20 = close * (1 + (Math.random() - 0.5) * 0.02);
      const sma50 = close * (1 + (Math.random() - 0.5) * 0.03);
      
      data.push({
        timestamp: date.toISOString(),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        open: Math.max(open, 0.01),
        high: Math.max(high, 0.01),
        low: Math.max(low, 0.01),
        close: Math.max(close, 0.01),
        volume,
        sma20: Math.max(sma20, 0.01),
        sma50: Math.max(sma50, 0.01)
      });
      
      currentPrice = close;
    }
    return data;
  };

  useEffect(() => {
    const fetchChartData = async () => {
      console.log(`Fetching enhanced chart data for ${symbol} with timeframe ${timeframe}`);
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const days = timeframe === '1D' ? 30 : timeframe === '7D' ? 90 : timeframe === '1M' ? 180 : 365;
      const mockData = generateCandleData(days);
      console.log(`Generated ${mockData.length} candlestick data points for ${symbol}`);
      setChartData(mockData);
      setIsLoading(false);
    };

    fetchChartData();
  }, [symbol, timeframe]);

  const firstPrice = chartData[0]?.close || 0;
  const lastPrice = chartData[chartData.length - 1]?.close || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <Card className="w-full max-w-6xl mx-auto">
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
            {['1D', '7D', '1M', '3M', '1Y'].map((tf) => (
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
              variant={indicators.sma50 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIndicators(prev => ({ ...prev, sma50: !prev.sma50 }))}
              className="text-xs"
            >
              SMA 50
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
          <div className="h-64 sm:h-96 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="space-y-4">
            {/* Main Price Chart */}
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'close') return [`$${value.toFixed(4)}`, 'Price'];
                      if (name === 'sma20') return [`$${value.toFixed(4)}`, 'SMA 20'];
                      if (name === 'sma50') return [`$${value.toFixed(4)}`, 'SMA 50'];
                      if (name === 'open') return [`$${value.toFixed(4)}`, 'Open'];
                      if (name === 'high') return [`$${value.toFixed(4)}`, 'High'];
                      if (name === 'low') return [`$${value.toFixed(4)}`, 'Low'];
                      return [`$${value.toFixed(4)}`, name];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
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
                      activeDot={{ r: 3, fill: 'hsl(var(--primary))' }}
                    />
                  ) : (
                    chartData.map((entry, index) => (
                      <CustomCandlestick
                        key={index}
                        payload={entry}
                        x={index * (100 / chartData.length)}
                        width={100 / chartData.length}
                      />
                    ))
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
                  
                  {indicators.sma50 && (
                    <Line 
                      type="monotone" 
                      dataKey="sma50" 
                      stroke="#3b82f6"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Volume Chart */}
            {indicators.volume && (
              <div className="h-16 sm:h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '10px'
                      }}
                    />
                    <Bar 
                      dataKey="volume" 
                      fill="hsl(var(--muted-foreground))"
                      opacity={0.6}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 sm:h-96 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No chart data available</p>
          </div>
        )}

        {/* Market Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/10 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">24h High</p>
            <p className="font-semibold text-xs sm:text-sm">${(lastPrice * 1.05).toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">24h Low</p>
            <p className="font-semibold text-xs sm:text-sm">${(lastPrice * 0.95).toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="font-semibold text-xs sm:text-sm">{(chartData[chartData.length - 1]?.volume / 1000000 || 0).toFixed(2)}M</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="font-semibold text-xs sm:text-sm">${(lastPrice * 21000000 / 1000000000).toFixed(2)}B</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
