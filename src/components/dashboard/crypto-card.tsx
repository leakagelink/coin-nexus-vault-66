
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Star, BarChart3 } from "lucide-react";

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
  
  const handleChartClick = () => {
    console.log(`Chart button clicked for ${symbol}`);
    if (onChartClick) {
      onChartClick();
    }
  };
  
  return (
    <Card className="glass crypto-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{symbol}</h3>
              {isWatchlisted && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
          
          <div className="flex gap-1">
            {onChartClick && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleChartClick}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title={`View ${symbol} chart`}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">
              ${price.toFixed(4)}
            </span>
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className={`${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border-0`}
            >
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {changePercent.toFixed(2)}%
              </div>
            </Badge>
          </div>
          
          <div className="flex items-center text-sm">
            <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change.toFixed(4)} USD
            </span>
            <span className="text-muted-foreground ml-1">24h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
