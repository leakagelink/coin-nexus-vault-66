
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, TrendingUp, TrendingDown, ShoppingCart, Wallet, RefreshCw, Search } from "lucide-react";
import { useRealTimePrices } from "@/hooks/useRealTimePrices";
import { TradingModal } from "@/components/trading/trading-modal";

const cryptoMapping = {
  'BTC': { name: 'Bitcoin', symbol: 'BTCUSDT' },
  'ETH': { name: 'Ethereum', symbol: 'ETHUSDT' },
  'BNB': { name: 'BNB', symbol: 'BNBUSDT' },
  'ADA': { name: 'Cardano', symbol: 'ADAUSDT' },
  'SOL': { name: 'Solana', symbol: 'SOLUSDT' },
  'USDT': { name: 'Tether', symbol: 'USDTUSDT' },
  'XRP': { name: 'Ripple', symbol: 'XRPUSDT' },
  'DOT': { name: 'Polkadot', symbol: 'DOTUSDT' },
  'LINK': { name: 'Chainlink', symbol: 'LINKUSDT' },
  'LTC': { name: 'Litecoin', symbol: 'LTCUSDT' },
  'DOGE': { name: 'Dogecoin', symbol: 'DOGEUSDT' },
  'TRX': { name: 'Tron', symbol: 'TRXUSDT' },
  'TON': { name: 'Toncoin', symbol: 'TONUSDT' },
  'MATIC': { name: 'Polygon', symbol: 'MATICUSDT' },
  'BCH': { name: 'Bitcoin Cash', symbol: 'BCHUSDT' },
  'AVAX': { name: 'Avalanche', symbol: 'AVAXUSDT' }
};

export function LiveMomentum() {
  const { prices, isLoading, error, refresh, isLive, lastUpdate } = useRealTimePrices();
  const [selectedCrypto, setSelectedCrypto] = useState<{ symbol: string; name: string; price: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleTrade = (symbol: string, price: number, type: 'buy' | 'sell') => {
    const crypto = cryptoMapping[symbol as keyof typeof cryptoMapping];
    setSelectedCrypto({
      symbol: crypto ? crypto.symbol : `${symbol}USDT`,
      name: crypto ? crypto.name : symbol,
      price: price
    });
  };

  // Get trading pairs based on search and momentum
  const getTradingPairs = () => {
    return Object.values(prices)
      .filter(crypto => 
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.momentum - a.momentum);
  };

  if (isLoading) {
    return (
      <Card className="glass w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 animate-pulse text-primary" />
            <span className="text-sm text-muted-foreground">Loading live market data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <Button size="sm" onClick={handleManualRefresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tradingPairs = getTradingPairs();

  return (
    <>
      <Card className="glass hover-glow w-full border-border/50">
        <CardHeader className="pb-3 px-4 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-foreground">Market Positions</span>
              {isLive && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30 animate-pulse">
                  LIVE
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0 border-border/50 hover:bg-muted/50"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Live Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Live updates every 4s</span>
            </div>
            {lastUpdate > 0 && (
              <span className="text-primary/70">
                Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago
              </span>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {tradingPairs.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className="group relative p-4 rounded-xl bg-gradient-to-br from-background/90 to-background/70 border border-border/40 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 backdrop-blur-sm"
                >
                  {/* Main container */}
                  <div className="space-y-4">
                    {/* Top section - Crypto info and price */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground tracking-wide">{crypto.symbol}</h3>
                            <p className="text-sm text-muted-foreground truncate">{crypto.name}</p>
                          </div>
                          
                          {/* Live Momentum Badge */}
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-medium px-3 py-1 animate-pulse shrink-0 ${
                              crypto.momentum > 15 ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                              crypto.momentum > 8 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                              'bg-green-500/15 text-green-400 border-green-500/30'
                            }`}
                          >
                            🔥 {crypto.momentum.toFixed(1)}
                          </Badge>
                        </div>
                        
                        {/* Price display */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="space-y-1">
                            <div className="text-xl font-bold gradient-text">
                              ₹{(crypto.price * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${crypto.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price change indicator */}
                      <div className="flex flex-col items-end text-right shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                          {crypto.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : crypto.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-danger" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-muted-foreground/50" />
                          )}
                          <span className={`text-sm font-bold ${
                            crypto.changePercent > 0 ? 'text-success' : 
                            crypto.changePercent < 0 ? 'text-danger' : 
                            'text-muted-foreground'
                          }`}>
                            {crypto.changePercent > 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vol: {(crypto.volume24h / 1000000).toFixed(1)}M
                        </div>
                      </div>
                    </div>

                    {/* Trading buttons with proper spacing */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/30">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-10 text-sm font-medium bg-success/10 text-success border-success/30 hover:bg-success/20 hover:border-success/50 transition-all duration-200 flex items-center justify-center gap-2"
                        onClick={() => handleTrade(crypto.symbol, crypto.price, 'buy')}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Long</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-10 text-sm font-medium bg-danger/10 text-danger border-danger/30 hover:bg-danger/20 hover:border-danger/50 transition-all duration-200 flex items-center justify-center gap-2"
                        onClick={() => handleTrade(crypto.symbol, crypto.price, 'sell')}
                      >
                        <Wallet className="h-4 w-4" />
                        <span>Short</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {tradingPairs.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No cryptocurrencies found for "{searchTerm}"</p>
                    <p className="text-xs text-muted-foreground/70">Try searching for Bitcoin, Ethereum, etc.</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
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
