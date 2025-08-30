
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
  const priceHistoryRef = useRef<Record<string, number[]>>({});

  // Calculate momentum based on price history (every 8 seconds)
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
      const newMomentum: Record<string, number> = {};
      Object.entries(prices).forEach(([symbol, priceData]) => {
        newMomentum[symbol] = calculateMomentum(symbol, priceData.price);
      });
      setMomentum(newMomentum);
    };

    updateMomentum();
    const momentumInterval = setInterval(updateMomentum, 8000); // Update every 8 seconds

    return () => clearInterval(momentumInterval);
  }, [prices]);

  // Manual refresh only when auto refresh is off
  useEffect(() => {
    if (isAutoRefresh) {
      intervalRef.current = setInterval(async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
      }, 30000); // Refresh every 30 seconds when auto is enabled
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

  const tradingPairs = getTradingPairs();

  return (
    <>
      <Card className="glass hover-glow">
        <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="hidden sm:inline">Live Market Positions</span>
              <span className="sm:hidden">Market Positions</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="h-7 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleAutoRefresh}
                className={`h-7 px-2 ${isAutoRefresh ? 'bg-green-900/20 text-green-400 border-green-700' : ''}`}
              >
                {isAutoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full ${isAutoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs">{isAutoRefresh ? 'Auto' : 'Manual'}</span>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-gray-900/50 border-gray-700 focus:border-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6 max-h-96 overflow-y-auto">
          <div className="grid gap-2 md:gap-3">
            {tradingPairs.map((crypto) => (
              <div
                key={crypto.symbol}
                className="p-2 md:p-3 rounded-lg border glass-subtle hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs md:text-sm truncate">{crypto.symbol}</span>
                        <span className="text-xs text-gray-400 hidden sm:inline">{crypto.name}</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                        <span className="text-sm md:text-lg font-bold gradient-text">
                          ₹{(crypto.price * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs animate-pulse ${
                            crypto.momentum > 15 ? 'bg-red-900/20 text-red-400 border-red-700' :
                            crypto.momentum > 8 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700' :
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

                    <div className="flex flex-col gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-6 md:h-7 px-2 text-xs bg-green-900/20 text-green-400 border-green-700 hover:bg-green-900/40"
                        onClick={() => handleTrade(crypto.symbol, crypto.price, 'buy')}
                      >
                        <ShoppingCart className="h-2.5 w-2.5 mr-1" />
                        <span className="hidden sm:inline">Long</span>
                        <span className="sm:hidden">L</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-6 md:h-7 px-2 text-xs bg-red-900/20 text-red-400 border-red-700 hover:bg-red-900/40"
                        onClick={() => handleTrade(crypto.symbol, crypto.price, 'sell')}
                      >
                        <Wallet className="h-2.5 w-2.5 mr-1" />
                        <span className="hidden sm:inline">Short</span>
                        <span className="sm:hidden">S</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {tradingPairs.length === 0 && searchTerm && (
              <div className="text-center py-4 text-gray-400">
                <p className="text-sm">No cryptocurrencies found for "{searchTerm}"</p>
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
