
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, ShoppingCart, Wallet } from "lucide-react";
import { useLCWPrices } from "@/hooks/useLCWPrices";
import { TradingModal } from "@/components/trading/trading-modal";

const cryptoMapping = {
  'BTC': { name: 'Bitcoin', symbol: 'BTCUSDT' },
  'ETH': { name: 'Ethereum', symbol: 'ETHUSDT' },
  'BNB': { name: 'BNB', symbol: 'BNBUSDT' },
  'ADA': { name: 'Cardano', symbol: 'ADAUSDT' },
  'SOL': { name: 'Solana', symbol: 'SOLUSDT' },
  'USDT': { name: 'Tether', symbol: 'USDTUSDT' }
};

export function LiveMomentum() {
  const { prices, isLoading, error } = useLCWPrices();
  const [selectedCrypto, setSelectedCrypto] = useState<{ symbol: string; name: string; price: number } | null>(null);

  // Calculate momentum based on 24h change
  const calculateMomentum = (change24h: number) => {
    return Math.abs(change24h) * 2; // Simple momentum calculation
  };

  // Get trending pairs based on momentum
  const getTrendingPairs = () => {
    return Object.entries(prices)
      .map(([symbol, priceData]) => {
        const crypto = cryptoMapping[symbol as keyof typeof cryptoMapping];
        if (!crypto) return null;
        
        return {
          symbol,
          name: crypto.name,
          price: priceData.price,
          changePercent: priceData.change24h,
          momentum: calculateMomentum(priceData.change24h),
          trend: priceData.change24h > 0.05 ? 'up' as const : 
                 priceData.change24h < -0.05 ? 'down' as const : 'neutral' as const,
          volume: priceData.volume24h || Math.random() * 2000000 + 500000
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.momentum - a!.momentum)
      .slice(0, 6);
  };

  const handleTrade = (symbol: string, price: number) => {
    setSelectedCrypto({
      symbol: `${symbol}USDT`,
      name: cryptoMapping[symbol as keyof typeof cryptoMapping]?.name || symbol,
      price: price
    });
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-6 md:py-8">
          <Activity className="h-6 w-6 md:h-8 md:w-8 animate-pulse text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-6 md:py-8">
          <div className="text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendingPairs = getTrendingPairs();

  return (
    <>
      <Card className="glass hover-glow">
        <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="hidden sm:inline">Live Market Momentum</span>
              <span className="sm:hidden">Market Momentum</span>
            </CardTitle>
            <div className="flex items-center gap-1 md:gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-green-400 rounded-full"></div>
              <span className="text-xs">Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6">
          <div className="grid gap-2 md:gap-3">
            {trendingPairs.map((crypto) => (
              <div
                key={crypto.symbol}
                className="p-2 md:p-3 rounded-lg border glass-subtle hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs md:text-sm truncate">{crypto.symbol}</span>
                      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                        <span className="text-sm md:text-lg font-bold gradient-text">
                          ₹{(crypto.price * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            crypto.momentum > 3 ? 'bg-red-900/20 text-red-400 border-red-700' :
                            crypto.momentum > 1.5 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700' :
                            'bg-green-900/20 text-green-400 border-green-700'
                          }`}
                        >
                          M: {crypto.momentum.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {crypto.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                        ) : crypto.trend === 'down' ? (
                          <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                        ) : (
                          <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-gray-400" />
                        )}
                        <span className={`text-xs md:text-sm font-medium ${
                          crypto.changePercent > 0 ? 'text-green-500' : 
                          crypto.changePercent < 0 ? 'text-red-500' : 
                          'text-gray-500'
                        }`}>
                          {crypto.changePercent > 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground hidden md:block">
                        Vol: {crypto.volume ? (crypto.volume / 1000000).toFixed(1) : '0'}M
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-6 md:h-8 px-2 md:px-3 text-xs bg-green-900/20 text-green-400 border-green-700 hover:bg-green-900/40"
                        onClick={() => handleTrade(crypto.symbol, crypto.price)}
                      >
                        <ShoppingCart className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                        <span className="hidden sm:inline">Buy</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-6 md:h-8 px-2 md:px-3 text-xs bg-red-900/20 text-red-400 border-red-700 hover:bg-red-900/40"
                        onClick={() => handleTrade(crypto.symbol, crypto.price)}
                      >
                        <Wallet className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                        <span className="hidden sm:inline">Sell</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCrypto && (
        <TradingModal
          isOpen={!!selectedCrypto}
          onClose={() => setSelectedCrypto(null)}
          symbol={selectedCrypto.symbol}
          name={selectedCrypto.name}
          currentPrice={selectedCrypto.price}
        />
      )}
    </>
  );
}
