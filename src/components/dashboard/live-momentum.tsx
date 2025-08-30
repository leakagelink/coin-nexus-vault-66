
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
      
      // Clear existing interval
      if (momentumIntervalRef.current) {
        clearInterval(momentumIntervalRef.current);
      }
      
      // Set new interval for 8 seconds
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
      <Card className="glass hover-glow w-full">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                <span className="truncate">Market Positions</span>
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleAutoRefresh}
                  className={`h-7 w-7 p-0 ${isAutoRefresh ? 'bg-green-900/20 text-green-400 border-green-700' : ''}`}
                >
                  {isAutoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-gray-900/50 border-gray-700 focus:border-blue-500"
              />
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${isAutoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>{isAutoRefresh ? 'Auto refresh' : 'Manual'}</span>
              </div>
              <span>Updates every 8s</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tradingPairs.map((crypto) => (
              <div
                key={crypto.symbol}
                className="p-3 rounded-lg border glass-subtle hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left side - Crypto info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">{crypto.symbol}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline truncate">{crypto.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold gradient-text">
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

                  {/* Middle - Price change */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      {crypto.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : crypto.trend === 'down' ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-gray-400" />
                      )}
                      <span className={`text-xs font-medium ${
                        crypto.changePercent > 0 ? 'text-green-500' : 
                        crypto.changePercent < 0 ? 'text-red-500' : 
                        'text-gray-500'
                      }`}>
                        {crypto.changePercent > 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      Vol: {crypto.volume ? (crypto.volume / 1000000).toFixed(1) : '0'}M
                    </div>
                  </div>

                  {/* Right side - Trading buttons */}
                  <div className="flex flex-col gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-6 px-2 text-xs bg-green-900/20 text-green-400 border-green-700 hover:bg-green-900/40"
                      onClick={() => handleTrade(crypto.symbol, crypto.price, 'buy')}
                    >
                      <ShoppingCart className="h-2.5 w-2.5 mr-1" />
                      <span className="hidden xs:inline">Long</span>
                      <span className="xs:hidden">L</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-6 px-2 text-xs bg-red-900/20 text-red-400 border-red-700 hover:bg-red-900/40"
                      onClick={() => handleTrade(crypto.symbol, crypto.price, 'sell')}
                    >
                      <Wallet className="h-2.5 w-2.5 mr-1" />
                      <span className="hidden xs:inline">Short</span>
                      <span className="xs:hidden">S</span>
                    </Button>
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
