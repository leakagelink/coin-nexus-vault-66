
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, ShoppingCart, Wallet } from "lucide-react";
import { useLivePrices } from "@/hooks/useLivePrices";
import { TradingModal } from "@/components/trading/trading-modal";

export function LiveMomentum() {
  const { prices, isLoading, getTrendingPairs, lastUpdate } = useLivePrices();
  const [selectedCrypto, setSelectedCrypto] = useState<{ symbol: string; name: string; price: number } | null>(null);

  const trendingPairs = getTrendingPairs();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleTrade = (symbol: string, price: number) => {
    setSelectedCrypto({
      symbol: `${symbol}USDT`,
      name: symbol,
      price: price
    });
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-8">
          <Activity className="h-8 w-8 animate-pulse text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass hover-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              Live Market Momentum
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Updated: {lastUpdate ? formatTime(lastUpdate) : 'Loading...'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            {trendingPairs.slice(0, 8).map((crypto) => (
              <div
                key={crypto.symbol}
                className="p-3 rounded-lg border glass-subtle hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{crypto.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold gradient-text">
                          ₹{(crypto.price * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs animate-pulse ${
                            crypto.momentum > 50 ? 'bg-red-900/20 text-red-400 border-red-700' :
                            crypto.momentum > 25 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700' :
                            'bg-green-900/20 text-green-400 border-green-700'
                          }`}
                        >
                          M: {crypto.momentum.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {crypto.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500 animate-pulse" />
                        ) : crypto.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500 animate-pulse" />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          crypto.changePercent > 0 ? 'text-green-500' : 
                          crypto.changePercent < 0 ? 'text-red-500' : 
                          'text-gray-500'
                        }`}>
                          {crypto.changePercent > 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Vol: {crypto.volume ? (crypto.volume / 1000000).toFixed(1) : '0'}M
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 px-3 text-xs bg-green-900/20 text-green-400 border-green-700 hover:bg-green-900/40"
                        onClick={() => handleTrade(crypto.symbol, crypto.price)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Buy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 px-3 text-xs bg-red-900/20 text-red-400 border-red-700 hover:bg-red-900/40"
                        onClick={() => handleTrade(crypto.symbol, crypto.price)}
                      >
                        <Wallet className="h-3 w-3 mr-1" />
                        Sell
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
