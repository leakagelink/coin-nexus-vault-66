

import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CryptoCard } from "./crypto-card";
import { usePriceData } from "@/hooks/usePriceData";
import { Loader2, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const cryptoMapping = {
  'BTC': { name: 'Bitcoin', symbol: 'BTCUSDT', minAmount: 350 },
  'ETH': { name: 'Ethereum', symbol: 'ETHUSDT', minAmount: 350 },
  'BNB': { name: 'BNB', symbol: 'BNBUSDT', minAmount: 150 },
  'ADA': { name: 'Cardano', symbol: 'ADAUSDT', minAmount: 150 },
  'SOL': { name: 'Solana', symbol: 'SOLUSDT', minAmount: 150 },
  'USDT': { name: 'Tether', symbol: 'USDTUSDT', minAmount: 50 }
};

export function MarketOverview() {
  const symbols = ['BTC','ETH','BNB','ADA','SOL','USDT'];
  const { prices: taapiPrices, isLoading, error } = usePriceData(symbols);
  const navigate = useNavigate();

  const handleChartClick = (symbol: string, name: string) => {
    const tradingSymbol = cryptoMapping[symbol as keyof typeof cryptoMapping]?.symbol || `${symbol}USDT`;
    console.log(`Navigating to chart page for ${tradingSymbol} - ${name}`);
    navigate(`/chart/${tradingSymbol}`);
  };

  const handleCryptoCardClick = (symbol: string, name: string) => {
    handleChartClick(symbol, name);
  };

  // Calculate momentum and stats from TAAPI prices
  const pricesWithMomentum = useMemo(() => {
    const priceHistory: Record<string, number[]> = {};
    
    return symbols.map(symbol => {
      const priceData = taapiPrices[symbol];
      if (!priceData) return null;
      
      // Track price history for momentum
      if (!priceHistory[symbol]) priceHistory[symbol] = [];
      priceHistory[symbol].push(priceData.priceUSD);
      if (priceHistory[symbol].length > 10) priceHistory[symbol].shift();
      
      // Calculate momentum
      let momentum = 0;
      if (priceHistory[symbol].length >= 2) {
        const changes = priceHistory[symbol].map((p, i, arr) => 
          i > 0 ? ((p - arr[i-1]) / arr[i-1]) * 100 : 0
        );
        momentum = Math.abs(changes.reduce((sum, c) => sum + c, 0));
      }
      
      const changePercent = priceHistory[symbol].length >= 2 
        ? ((priceData.priceUSD - priceHistory[symbol][0]) / priceHistory[symbol][0]) * 100 
        : 0;
      
      return {
        symbol,
        price: priceData.priceUSD,
        priceINR: priceData.priceINR,
        momentum,
        changePercent,
        change24h: (priceData.priceUSD * changePercent) / 100,
        marketCap: priceData.priceUSD * 1000000000, // Simulated
        volume24h: 10000000 + Math.random() * 50000000,
        lastUpdate: priceData.lastUpdate
      };
    }).filter(Boolean);
  }, [taapiPrices, symbols]);

  // Calculate market stats
  const marketStats = pricesWithMomentum.reduce((acc, priceData) => {
    if (!priceData) return acc;
    acc.totalMarketCap += priceData.marketCap || 0;
    acc.gainers += priceData.changePercent > 0 ? 1 : 0;
    acc.losers += priceData.changePercent < 0 ? 1 : 0;
    acc.totalVolume += priceData.volume24h || 0;
    return acc;
  }, { totalMarketCap: 0, gainers: 0, losers: 0, totalVolume: 0 });

  const lastUpdate = pricesWithMomentum.length > 0 && pricesWithMomentum[0] 
    ? pricesWithMomentum[0].lastUpdate 
    : Date.now();
  const isLive = pricesWithMomentum.length > 0;

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
            {symbols.filter(sym => sym !== 'USDT').map((sym) => {
              const crypto = cryptoMapping[sym as keyof typeof cryptoMapping];
              const priceData = pricesWithMomentum.find(p => p?.symbol === sym);
              
              if (!priceData) return null;
              
              return (
                <div key={sym} onClick={() => handleCryptoCardClick(sym, crypto.name)} className="cursor-pointer">
                  <CryptoCard
                    symbol={sym}
                    name={crypto.name}
                    price={priceData.price}
                    change={priceData.change24h}
                    changePercent={priceData.changePercent}
                    isWatchlisted={false}
                    onChartClick={() => handleChartClick(sym, crypto.name)}
                    momentum={priceData.momentum}
                    minimumAmount={crypto.minAmount}
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
