
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLivePrices } from "@/hooks/useLivePrices";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export function LiveMomentum() {
  const { prices, isLoading, error, getTrendingPairs, lastUpdate } = useLivePrices();
  const [timeAgo, setTimeAgo] = useState('just now');

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

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
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

  const trendingPairs = getTrendingPairs();

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            Live Momentum
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && !trendingPairs.length ? (
          <div className="text-center py-4">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {trendingPairs.map((pair, index) => {
                const isPositive = pair.changePercent >= 0;
                const momentum = Math.abs(pair.changePercent);
                
                return (
                  <div 
                    key={pair.symbol}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pair.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold">
                          ${pair.price.toFixed(pair.price > 1 ? 2 : 4)}
                        </div>
                        <div className={`text-sm flex items-center gap-1 ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {pair.changePercent.toFixed(2)}%
                        </div>
                      </div>
                      
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isPositive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(momentum * 10, 100)}%`,
                            marginLeft: isPositive ? '0' : 'auto'
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
                  <span>Live Trading</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
