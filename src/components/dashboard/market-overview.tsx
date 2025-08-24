
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CryptoCard } from "./crypto-card";
import { useLivePrices } from "@/hooks/useLivePrices";
import { Loader2 } from "lucide-react";

const cryptoMapping = {
  'BTCUSDT': { name: 'Bitcoin', symbol: 'BTC' },
  'ETHUSDT': { name: 'Ethereum', symbol: 'ETH' },
  'BNBUSDT': { name: 'BNB', symbol: 'BNB' },
  'ADAUSDT': { name: 'Cardano', symbol: 'ADA' },
  'SOLUSDT': { name: 'Solana', symbol: 'SOL' },
  'USDTINR': { name: 'Tether', symbol: 'USDT' }
};

export function MarketOverview() {
  const { prices, isLoading, error } = useLivePrices();

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="gradient-text">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading live prices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="gradient-text">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="gradient-text">Live Market Prices</CardTitle>
        <p className="text-sm text-muted-foreground">Real-time data from Binance</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(prices).map(([binanceSymbol, priceData]) => {
            const crypto = cryptoMapping[binanceSymbol as keyof typeof cryptoMapping];
            if (!crypto) return null;

            return (
              <CryptoCard
                key={binanceSymbol}
                symbol={binanceSymbol}
                name={crypto.name}
                price={priceData.price}
                change={priceData.change}
                changePercent={priceData.changePercent}
                isWatchlisted={false}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
