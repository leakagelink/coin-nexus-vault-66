
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Star, BarChart3, Activity } from "lucide-react";

interface CryptoCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isWatchlisted?: boolean;
  onChartClick?: () => void;
}

export function CryptoCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  isWatchlisted = false,
  onChartClick
}: CryptoCardProps) {
  const isPositive = changePercent >= 0;
  
  const handleChartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Chart button clicked for ${symbol} - ${name}`);
    if (onChartClick) {
      onChartClick();
    }
  };
  
  return (
    <Card className="glass crypto-card hover:shadow-lg transition-all duration-200 hover:scale-105 group cursor-pointer">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg sm:text-xl truncate">{symbol}</h3>
              {isWatchlisted && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{name}</p>
          </div>
          
          <div className="flex gap-1 ml-2">
            {onChartClick && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleChartClick}
                className="h-9 w-9 p-0 hover:bg-primary/10 opacity-70 group-hover:opacity-100 transition-opacity"
                title={`View ${symbol} chart`}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Price Display */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-bold block">
                ${price.toFixed(price > 1 ? 2 : 4)}
              </span>
            </div>
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className={`${
                isPositive 
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              } border transition-colors`}
            >
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-medium">
                  {Math.abs(changePercent).toFixed(2)}%
                </span>
              </div>
            </Badge>
          </div>
          
          {/* Change Display */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{change.toFixed(change > 1 ? 2 : 4)} USD
              </span>
              <span className="text-muted-foreground">24h</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Live</span>
            </div>
          </div>

          {/* Mini Chart Indicator */}
          <div className="flex items-center justify-center pt-2">
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isPositive ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min(Math.abs(changePercent) * 10, 100)}%`,
                  marginLeft: isPositive ? '0' : 'auto'
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
