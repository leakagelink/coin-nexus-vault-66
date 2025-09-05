
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CryptoCard } from "./crypto-card";
import { useBinancePrices } from "@/hooks/useBinancePrices";
import { Loader2, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const cryptoMapping = {
  'BTC': { name: 'Bitcoin', symbol: 'BTCUSDT' },
  'ETH': { name: 'Ethereum', symbol: 'ETHUSDT' },
  'BNB': { name: 'BNB', symbol: 'BNBUSDT' },
  'ADA': { name: 'Cardano', symbol: 'ADAUSDT' },
  'SOL': { name: 'Solana', symbol: 'SOLUSDT' },
  'USDT': { name: 'Tether', symbol: 'USDTUSDT' }
};

export function MarketOverview() {
  const { prices, isLoading, error, isLive, lastUpdate } = useBinancePrices();
  const navigate = useNavigate();

  const handleChartClick = (symbol: string, name: string) => {
    const tradingSymbol = cryptoMapping[symbol as keyof typeof cryptoMapping]?.symbol || `${symbol}USDT`;
    console.log(`Navigating to chart page for ${tradingSymbol} - ${name}`);
    navigate(`/chart/${tradingSymbol}`);
  };

  const handleCryptoCardClick = (symbol: string, name: string) => {
    handleChartClick(symbol, name);
  };

  // Calculate market stats from real-time data
  const marketStats = Object.values(prices).reduce((acc, priceData) => {
    acc.totalMarketCap += priceData.marketCap || 0;
    acc.gainers += priceData.changePercent > 0 ? 1 : 0;
    acc.losers += priceData.changePercent < 0 ? 1 : 0;
    acc.totalVolume += priceData.volume24h || 0;
    
    return acc;
  }, { totalMarketCap: 0, gainers: 0, losers: 0, totalVolume: 0 });

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="gradient-text">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Loading live market data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="gradient-text">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mb-4">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">Please check your connection and try again</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Market Cap</p>
                <p className="text-lg font-bold">${(marketStats.totalMarketCap / 1000000000).toFixed(2)}B</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">24h Volume</p>
                <p className="text-lg font-bold">${(marketStats.totalVolume / 1000000).toFixed(1)}M</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Gainers</p>
                <p className="text-lg font-bold text-green-600">{marketStats.gainers}</p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">+</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Losers</p>
                <p className="text-lg font-bold text-red-600">{marketStats.losers}</p>
              </div>
              <Badge variant="destructive" className="bg-red-100 text-red-800">-</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="gradient-text text-xl sm:text-2xl">Live Market Prices</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Click any coin to view professional trading chart</p>
            </div>
            <div className="flex items-center gap-3">
              {isLive && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs">LIVE</span>
                  </div>
                </Badge>
              )}
              {lastUpdate > 0 && (
                <span className="text-xs text-muted-foreground">
                  Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
            {Object.values(prices).slice(0, 6).map((priceData) => {
              const crypto = cryptoMapping[priceData.symbol as keyof typeof cryptoMapping];
              if (!crypto) return null;

              return (
                <div key={priceData.symbol} onClick={() => handleCryptoCardClick(priceData.symbol, crypto.name)} className="cursor-pointer">
                  <CryptoCard
                    symbol={priceData.symbol}
                    name={crypto.name}
                    price={priceData.price}
                    change={priceData.change24h}
                    changePercent={priceData.changePercent}
                    isWatchlisted={false}
                    onChartClick={() => handleChartClick(priceData.symbol, crypto.name)}
                    momentum={priceData.momentum}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
