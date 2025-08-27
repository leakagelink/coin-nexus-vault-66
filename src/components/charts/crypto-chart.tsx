
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Calendar, X } from 'lucide-react';

interface CryptoChartProps {
  symbol: string;
  name: string;
  onClose: () => void;
}

interface PricePoint {
  timestamp: string;
  price: number;
  date: string;
}

export function CryptoChart({ symbol, name, onClose }: CryptoChartProps) {
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [timeframe, setTimeframe] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  const generateMockData = (days: number) => {
    const data: PricePoint[] = [];
    const now = new Date();
    const basePrice = Math.random() * 50000 + 1000; // Random base price between 1000-51000
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const randomChange = (Math.random() - 0.5) * 0.1; // ±5% daily change
      const price = basePrice * (1 + randomChange * (days - i) / days);
      
      data.push({
        timestamp: date.toISOString(),
        price: Math.max(price, 0.01),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return data;
  };

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const mockData = generateMockData(days);
      setChartData(mockData);
      setIsLoading(false);
    };

    fetchChartData();
  }, [symbol, timeframe]);

  const firstPrice = chartData[0]?.price || 0;
  const lastPrice = chartData[chartData.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const chartConfig = {
    price: {
      label: "Price",
      color: isPositive ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">{symbol} Chart</CardTitle>
          <p className="text-sm text-muted-foreground">{name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">${lastPrice.toFixed(4)}</p>
            <div className={`flex items-center gap-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-medium">
                {isPositive ? '+' : ''}${priceChange.toFixed(4)} ({priceChangePercent.toFixed(2)}%)
              </span>
              <span className="text-sm text-muted-foreground">
                {timeframe}
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe buttons */}
        <div className="flex gap-2">
          {['1d', '7d', '30d', '90d'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>

        {/* Chart */}
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={chartConfig.price.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
