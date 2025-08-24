
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { TrendingUp, Wallet, Activity } from "lucide-react";

export function PortfolioSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="glass hover-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <PriceDisplay
            price={245678.90}
            change={5432.10}
            changePercent={2.26}
            symbol="INR"
            size="lg"
            showIcon={false}
          />
        </CardContent>
      </Card>
      
      <Card className="glass hover-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹12,345.67</div>
          <p className="text-xs text-muted-foreground">Ready to trade</p>
        </CardContent>
      </Card>
      
      <Card className="glass hover-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h P&L</CardTitle>
          <Activity className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <PriceDisplay
            price={1234.56}
            change={234.56}
            changePercent={23.45}
            symbol="INR"
            size="md"
            showIcon={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
