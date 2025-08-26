
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { TradingModal } from "@/components/trading/trading-modal";

interface CryptoCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  isWatchlisted?: boolean;
}

export function CryptoCard({ 
  symbol, 
  name, 
  price, 
  change, 
  changePercent,
  volume,
  marketCap,
  isWatchlisted = false
}: CryptoCardProps) {
  const [showTradingModal, setShowTradingModal] = useState(false);
  const isPositive = change >= 0;

  // Convert USD to INR (approximate rate: 1 USD = 84 INR)
  const usdToInrRate = 84;
  const inrPrice = price * usdToInrRate;
  const inrChange = change * usdToInrRate;

  return (
    <>
      <Card className="glass hover-glow transition-all duration-300 hover:scale-105">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">{symbol}</h3>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowTradingModal(true)}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Trade
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xl font-bold">${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                <span className="text-sm text-muted-foreground">₹{inrPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className={`flex flex-col items-end gap-1 text-sm font-medium ${
                isPositive ? 'text-success' : 'text-danger'
              }`}>
                <div className="flex items-center gap-1">
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? '+' : ''}${Math.abs(change).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs">
                  ₹{Math.abs(inrChange).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            
            <div className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </div>

            {volume && (
              <div className="text-xs text-muted-foreground">
                <div>Volume: ${volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                <div>₹{(volume * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            )}
            
            {marketCap && (
              <div className="text-xs text-muted-foreground">
                <div>Market Cap: ${marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                <div>₹{(marketCap * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            )}
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
