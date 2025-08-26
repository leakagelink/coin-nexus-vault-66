
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CryptoCard } from "./crypto-card";
import { useCMCPrices } from "@/hooks/useCMCPrices";
import { Loader2 } from "lucide-react";

const cryptoMapping = {
  'BTC': { name: 'Bitcoin', symbol: 'BTC' },
  'ETH': { name: 'Ethereum', symbol: 'ETH' },
  'BNB': { name: 'BNB', symbol: 'BNB' },
  'ADA': { name: 'Cardano', symbol: 'ADA' },
  'SOL': { name: 'Solana', symbol: 'SOL' },
  'USDT': { name: 'Tether', symbol: 'USDT' }
};

export function MarketOverview() {
  const { prices, isLoading, error } = useCMCPrices();

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="gradient-text">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading live prices from CoinMarketCap...</span>
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
        <p className="text-sm text-muted-foreground">Real-time data from CoinMarketCap</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(prices).map(([symbol, priceData]) => {
            const crypto = cryptoMapping[symbol as keyof typeof cryptoMapping];
            if (!crypto) return null;

            return (
              <CryptoCard
                key={symbol}
                symbol={symbol}
                name={crypto.name}
                price={priceData.price}
                change={priceData.change24h * priceData.price / 100}
                changePercent={priceData.change24h}
                isWatchlisted={false}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
