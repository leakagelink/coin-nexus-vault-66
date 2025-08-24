
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { Button } from "@/components/ui/button";
import { Star, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TradingModal } from "@/components/trading/trading-modal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CryptoCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  icon?: string;
  isWatchlisted?: boolean;
  className?: string;
}

export function CryptoCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  icon,
  isWatchlisted = false,
  className
}: CryptoCardProps) {
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(isWatchlisted);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleWatchlistToggle = async () => {
    if (!user) return;

    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol);

        if (error) throw error;
        setIsInWatchlist(false);
        toast({
          title: "Removed from watchlist",
          description: `${symbol} has been removed from your watchlist`,
        });
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            symbol: symbol,
            name: name
          });

        if (error) throw error;
        setIsInWatchlist(true);
        toast({
          title: "Added to watchlist",
          description: `${symbol} has been added to your watchlist`,
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className={cn("glass hover-glow transition-all duration-300 cursor-pointer", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {symbol.replace('USDT', '').substring(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{symbol.replace('USDT', '')}</h3>
                <p className="text-sm text-muted-foreground">{name}</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isInWatchlist ? "text-secondary" : "text-muted-foreground"
              )}
              onClick={handleWatchlistToggle}
            >
              <Star className={cn("h-4 w-4", isInWatchlist && "fill-current")} />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <PriceDisplay
              price={price}
              change={change}
              changePercent={changePercent}
              symbol="USDT"
              size="sm"
            />
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-gradient-success text-success-foreground hover:opacity-90"
                onClick={() => setShowTradingModal(true)}
              >
                Trade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TradingModal
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        symbol={symbol}
        name={name}
        currentPrice={price}
      />
    </>
  );
}
