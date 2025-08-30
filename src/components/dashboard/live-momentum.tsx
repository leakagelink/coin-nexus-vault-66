
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, TrendingUp, TrendingDown, ShoppingCart, Wallet, RefreshCw, Play, Pause, Search } from "lucide-react";
import { useLCWPrices } from "@/hooks/useLCWPrices";
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
  const { prices, isLoading, error, refresh } = useLCWPrices();
  const [selectedCrypto, setSelectedCrypto] = useState<{ symbol: string; name: string; price: number } | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [momentum, setMomentum] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const momentumIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const priceHistoryRef = useRef<Record<string, number[]>>({});

  // Calculate momentum based on price history
  const calculateMomentum = (symbol: string, currentPrice: number) => {
    if (!priceHistoryRef.current[symbol]) {
      priceHistoryRef.current[symbol] = [];
    }
    
    const history = priceHistoryRef.current[symbol];
    history.push(currentPrice);
    
    if (history.length > 10) {
      history.shift();
    }
    
    if (history.length < 3) return Math.random() * 20;
    
    const recentPrices = history.slice(-5);
    const trend = recentPrices.reduce((acc, price, idx) => {
      if (idx === 0) return acc;
      return acc + (price - recentPrices[idx - 1]);
    }, 0);
    
    return Math.abs(trend / currentPrice) * 1000;
  };

  // Update momentum every 8 seconds
  useEffect(() => {
    const updateMomentum = () => {
      console.log('Updating momentum at:', new Date().toLocaleTimeString());
      const newMomentum: Record<string, number> = {};
      Object.entries(prices).forEach(([symbol, priceData]) => {
        newMomentum[symbol] = calculateMomentum(symbol, priceData.price);
      });
      setMomentum(newMomentum);
    };

    if (Object.keys(prices).length > 0) {
      updateMomentum();
      
      if (momentumIntervalRef.current) {
        clearInterval(momentumIntervalRef.current);
      }
      
      momentumIntervalRef.current = setInterval(updateMomentum, 8000);
    }

    return () => {
      if (momentumIntervalRef.current) {
        clearInterval(momentumIntervalRef.current);
      }
    };
  }, [prices]);

  // Auto refresh for prices (separate from momentum)
  useEffect(() => {
    if (isAutoRefresh) {
      intervalRef.current = setInterval(async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
      }, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh, refresh]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
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
    return Object.entries(prices)
      .map(([symbol, priceData]) => {
        const crypto = cryptoMapping[symbol as keyof typeof cryptoMapping];
        if (!crypto) return null;
        
        return {
          symbol,
          name: crypto.name,
          price: priceData.price,
          changePercent: priceData.change24h,
          momentum: momentum[symbol] || 0,
          trend: priceData.change24h > 0.05 ? 'up' as const : 
                 priceData.change24h < -0.05 ? 'down' as const : 'neutral' as const,
          volume: priceData.volume24h || Math.random() * 2000000 + 500000
        };
      })
      .filter(Boolean)
      .filter(crypto => 
        crypto!.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto!.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b!.momentum - a!.momentum);
  };

  if (isLoading) {
    return (
      <Card className="glass w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Activity className="h-6 w-6 animate-pulse text-primary" />
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
              <Button
                size="sm"
                variant="outline"
                onClick={toggleAutoRefresh}
                className={`h-8 w-8 p-0 border-border/50 ${isAutoRefresh ? 'bg-primary/20 text-primary border-primary/30' : 'hover:bg-muted/50'}`}
              >
                {isAutoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
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

          {/* Status indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/50'}`}></div>
              <span>{isAutoRefresh ? 'Auto refresh ON' : 'Manual mode'}</span>
            </div>
            <span className="text-primary/70">Updates every 8s</span>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <style>
            {`
              .scrollbar-hide {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
            {tradingPairs.map((crypto) => (
              <div
                key={crypto.symbol}
                className="group relative p-4 rounded-xl bg-gradient-to-br from-background/80 to-background/60 border border-border/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 backdrop-blur-sm"
              >
                {/* Main container with proper spacing */}
                <div className="space-y-4">
                  {/* Top row - Crypto info and price */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-foreground tracking-wide">{crypto.symbol}</h3>
                          <p className="text-sm text-muted-foreground truncate">{crypto.name}</p>
                        </div>
                      </div>
                      
                      {/* Price and momentum info */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="space-y-1">
                          <div className="text-lg font-bold gradient-text">
                            ₹{(crypto.price * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${crypto.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium px-3 py-1 animate-pulse ${
                            crypto.momentum > 15 ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                            crypto.momentum > 8 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                            'bg-green-500/15 text-green-400 border-green-500/30'
                          }`}
                        >
                          Momentum: {crypto.momentum.toFixed(1)}
                        </Badge>
                      </div>
                    </div>

                    {/* Price change indicator */}
                    <div className="flex flex-col items-end text-right">
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
                        Vol: {crypto.volume ? (crypto.volume / 1000000).toFixed(1) : '0'}M
                      </div>
                    </div>
                  </div>

                  {/* Bottom row - Trading buttons */}
                  <div className="flex items-center justify-center gap-3 pt-2 border-t border-border/20">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 h-9 text-sm font-medium bg-success/10 text-success border-success/30 hover:bg-success/20 hover:border-success/40 transition-all duration-200"
                      onClick={() => handleTrade(crypto.symbol, crypto.price, 'buy')}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Long Position
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 h-9 text-sm font-medium bg-danger/10 text-danger border-danger/30 hover:bg-danger/20 hover:border-danger/40 transition-all duration-200"
                      onClick={() => handleTrade(crypto.symbol, crypto.price, 'sell')}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Short Position
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
