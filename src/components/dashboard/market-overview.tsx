
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CryptoCard } from "./crypto-card";
import { useLCWPrices } from "@/hooks/useLCWPrices";
import { ChartModal } from "../charts/chart-modal";
import { Loader2, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const cryptoMapping = {
  'BTC': { name: 'Bitcoin', symbol: 'BTC' },
  'ETH': { name: 'Ethereum', symbol: 'ETH' },
  'BNB': { name: 'BNB', symbol: 'BNB' },
  'ADA': { name: 'Cardano', symbol: 'ADA' },
  'SOL': { name: 'Solana', symbol: 'SOL' },
  'USDT': { name: 'Tether', symbol: 'USDT' }
};

export function MarketOverview() {
  const { prices, isLoading, error } = useLCWPrices();
  const [selectedChart, setSelectedChart] = useState<{ symbol: string; name: string } | null>(null);

  const handleChartClick = (symbol: string, name: string) => {
    console.log(`Opening chart for ${symbol} - ${name}`);
    setSelectedChart({ symbol, name });
  };

  const handleCloseChart = () => {
    setSelectedChart(null);
  };

  // Calculate market stats
  const marketStats = Object.entries(prices).reduce((acc, [symbol, priceData]) => {
    const crypto = cryptoMapping[symbol as keyof typeof cryptoMapping];
    if (!crypto) return acc;
    
    acc.totalMarketCap += priceData.price * 1000000; // Mock market cap
    acc.gainers += priceData.change24h > 0 ? 1 : 0;
    acc.losers += priceData.change24h < 0 ? 1 : 0;
    acc.totalVolume += Math.random() * 1000000; // Mock volume
    
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
    <>
      <div className="space-y-6">
        {/* Market Stats Cards */}
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

        {/* Main Market Overview */}
        <Card className="glass">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="gradient-text text-xl sm:text-2xl">Live Market Prices</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Real-time data from LiveCoinWatch</p>
              </div>
              <Badge variant="outline" className="w-fit">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">Live</span>
                </div>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
              {Object.entries(prices).map(([symbol, priceData]) => {
                const crypto = cryptoMapping[symbol as keyof typeof cryptoMapping];
                if (!crypto) return null;

                return (
                  <CryptoCard
                    key={symbol}
                    symbol={symbol}
                    name={crypto.name}
                    price={priceData.price}
                    change={priceData.change24h * priceData.price / 100}
                    changePercent={priceData.change24h}
                    isWatchlisted={false}
                    onChartClick={() => handleChartClick(symbol, crypto.name)}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedChart && (
        <ChartModal
          isOpen={!!selectedChart}
          onClose={handleCloseChart}
          symbol={selectedChart.symbol}
          name={selectedChart.name}
        />
      )}
    </>
  );
}
