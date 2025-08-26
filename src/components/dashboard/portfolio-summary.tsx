
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function PortfolioSummary() {
  const { user } = useAuth();

  // Fetch wallet balance
  const { data: wallet } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch portfolio positions
  const { data: positions } = useQuery({
    queryKey: ['portfolio-positions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch recent trades
  const { data: trades } = useQuery({
    queryKey: ['trades', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const walletBalance = Number(wallet?.balance || 0);
  const totalInvestment = positions?.reduce((sum, pos) => sum + Number(pos.total_investment || 0), 0) || 0;
  const totalCurrentValue = positions?.reduce((sum, pos) => sum + Number(pos.current_value || 0), 0) || 0;
  const totalPnL = totalCurrentValue - totalInvestment;
  const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  const stats = [
    {
      title: "Wallet Balance",
      value: walletBalance,
      usdtValue: walletBalance / 84,
      icon: Wallet,
      change: 0,
      changeType: "neutral" as const,
    },
    {
      title: "Total Investment",
      value: totalInvestment,
      usdtValue: totalInvestment / 84,
      icon: Activity,
      change: 0,
      changeType: "neutral" as const,
    },
    {
      title: "Current Value",
      value: totalCurrentValue,
      usdtValue: totalCurrentValue / 84,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      change: totalPnLPercent,
      changeType: totalPnL >= 0 ? "positive" : "negative" as const,
    },
    {
      title: "Total P&L",
      value: totalPnL,
      usdtValue: totalPnL / 84,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      change: totalPnLPercent,
      changeType: totalPnL >= 0 ? "positive" : "negative" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="glass hover-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    ₹{stat.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${stat.usdtValue.toFixed(2)} USDT
                  </div>
                  {stat.change !== 0 && (
                    <p className={`text-xs flex items-center gap-1 ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {stat.changeType === 'positive' ? '↗' : stat.changeType === 'negative' ? '↘' : ''}
                      {Math.abs(stat.change).toFixed(2)}%
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {trades && trades.length > 0 ? (
            <div className="space-y-3">
              {trades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      trade.trade_type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{trade.coin_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.trade_type.toUpperCase()} • {trade.quantity} {trade.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₹{Number(trade.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${(Number(trade.total_amount) / 84).toFixed(2)} USDT
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trade.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
