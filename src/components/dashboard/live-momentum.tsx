
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLivePrices } from "@/hooks/useLivePrices";
import { TrendingUp, TrendingDown, Activity, Zap, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";

export function LiveMomentum() {
  const { prices, isLoading, error, getTrendingPairs, lastUpdate } = useLivePrices();
  const [timeAgo, setTimeAgo] = useState('just now');
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const updateTimeAgo = () => {
      if (lastUpdate) {
        const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
        if (seconds < 60) {
          setTimeAgo(`${seconds}s ago`);
        } else {
          setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
        }
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Trigger pulse animation when prices update
  useEffect(() => {
    if (lastUpdate) {
      setPulseKey(prev => prev + 1);
    }
  }, [lastUpdate]);

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
            Live Momentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse space-y-3 w-full">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allPrices = Object.values(prices);

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
            Live Momentum
            <Badge variant="outline" className="text-xs animate-pulse bg-green-50 text-green-700 border-green-300">
              LIVE • 3s
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && !allPrices.length ? (
          <div className="text-center py-4">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {allPrices.slice(0, 8).map((pair, index) => {
                const isPositive = pair.changePercent >= 0;
                const momentum = pair.momentum || 0;
                
                const getTrendIcon = () => {
                  if (pair.trend === 'up') return <ArrowUp className="h-3 w-3 text-green-500" />;
                  if (pair.trend === 'down') return <ArrowDown className="h-3 w-3 text-red-500" />;
                  return <Minus className="h-3 w-3 text-gray-500" />;
                };
                
                return (
                  <div 
                    key={`${pair.symbol}-${pulseKey}`}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-500 animate-pulse ${
                      pair.trend === 'up' ? 'bg-green-50 border border-green-200 shadow-sm' :
                      pair.trend === 'down' ? 'bg-red-50 border border-red-200 shadow-sm' :
                      'bg-muted/30 hover:bg-muted/50 border border-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{pair.symbol}</span>
                        {getTrendIcon()}
                        <Badge 
                          variant={momentum > 5 ? "default" : "outline"} 
                          className={`text-xs transition-all duration-300 ${
                            momentum > 10 ? 'bg-red-500 text-white animate-pulse' :
                            momentum > 5 ? 'bg-yellow-500 text-white' :
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          M: {momentum.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-sm">
                          ₹{(pair.price * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-xs flex items-center gap-1 font-medium ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {isPositive ? '+' : ''}{pair.changePercent.toFixed(3)}%
                        </div>
                      </div>
                      
                      <div className="w-16 h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            pair.trend === 'up' ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                            pair.trend === 'down' ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                            'bg-gradient-to-r from-gray-300 to-gray-500'
                          }`}
                          style={{ 
                            width: `${Math.min(Math.max(momentum * 8, 15), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-2 border-t border-muted/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Market Status</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Trading • Updates every 3s • Enhanced Momentum</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
