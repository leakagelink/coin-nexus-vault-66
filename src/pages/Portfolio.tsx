
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLCWPrices } from "@/hooks/useLCWPrices";
import { TrendingUp, TrendingDown, DollarSign, Percent, TrendingUpIcon, Activity } from "lucide-react";
import { useState } from "react";
import { TradingModal } from "@/components/trading/trading-modal";
import { useToast } from "@/hooks/use-toast";
import { usePositionUpdater } from "@/hooks/usePositionUpdater";

type PortfolioPosition = {
  id: string;
  symbol: string;
  coin_name: string;
  amount: number;
  buy_price: number;
  current_price: number;
  total_investment: number;
  current_value: number;
  pnl: number;
  pnl_percentage: number;
};

const Portfolio = () => {
  const { user } = useAuth();
  const { prices, lastUpdate, isLive } = useLCWPrices();
  const { toast } = useToast();
  
  // Auto-update positions with live prices
  usePositionUpdater(user?.id);
  const [selectedCrypto, setSelectedCrypto] = useState<{
    symbol: string;
    name: string;
    currentPrice: number;
  } | null>(null);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);

  // Get minimum trading amount for each coin
  const getMinimumAmount = (symbol: string) => {
    if (symbol === 'BTC' || symbol === 'ETH') return 350;
    if (symbol === 'XRP' || symbol === 'DOGE') return 50;
    return 150; // Default for other coins
  };

  const { data: positions, isLoading, refetch } = useQuery({
    queryKey: ["portfolio-positions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("portfolio_positions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PortfolioPosition[];
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Update positions with live prices - respect admin edits
  const updatedPositions = positions?.map(position => {
    // Use admin-edited values if they exist, otherwise calculate from live prices
    const shouldUseLivePrice = position.current_price === position.buy_price; // Indicates fresh position
    const livePrice = prices[position.symbol]?.price || position.current_price;
    
    // If admin has edited the position, keep the edited values
    if (!shouldUseLivePrice && Math.abs(position.current_price - livePrice) > livePrice * 0.01) {
      // Admin has set custom values, keep them as is
      return position;
    }
    
    // Use live prices for calculation
    const currentValue = position.amount * livePrice;
    const pnl = currentValue - position.total_investment;
    const pnlPercentage = position.total_investment > 0 ? (pnl / position.total_investment) * 100 : 0;
    
    return {
      ...position,
      current_price: livePrice,
      current_value: currentValue,
      pnl,
      pnl_percentage: pnlPercentage,
    };
  });

  const totalInvestment = updatedPositions?.reduce((sum, p) => sum + p.total_investment, 0) || 0;
  const totalCurrentValue = updatedPositions?.reduce((sum, p) => sum + p.current_value, 0) || 0;
  const totalPnL = totalCurrentValue - totalInvestment;
  const totalPnLPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  const handleTradeClick = (position: PortfolioPosition) => {
    const livePrice = prices[position.symbol]?.price || position.current_price;
    setSelectedCrypto({
      symbol: position.symbol + 'USDT',
      name: position.coin_name,
      currentPrice: livePrice,
    });
    setIsTradingModalOpen(true);
  };

  const handleTradingModalClose = () => {
    setIsTradingModalOpen(false);
    setSelectedCrypto(null);
    refetch(); // Refresh portfolio data after trade
  };

  const handleClosePosition = async (position: PortfolioPosition) => {
    if (!user) return;

    try {
      const livePrice = prices[position.symbol]?.price || position.current_price;
      const proceeds = position.amount * livePrice;

      // Delete the position
      const { error: positionError } = await supabase
        .from('portfolio_positions')
        .delete()
        .eq('id', position.id);

      if (positionError) throw positionError;

      // Update wallet balance
      const { data: walletData, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletFetchError) throw walletFetchError;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: Number(walletData.balance) + proceeds,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // Record the trade
      const { error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          symbol: position.symbol,
          coin_name: position.coin_name,
          trade_type: 'sell',
          quantity: position.amount,
          price: livePrice,
          total_amount: proceeds,
          status: 'completed',
        });

      if (tradeError) throw tradeError;

      toast({
        title: "Position closed successfully",
        description: `Sold ${position.amount.toFixed(6)} ${position.symbol} for ₹${proceeds.toFixed(2)}`,
      });

      refetch(); // Refresh portfolio data
    } catch (error: any) {
      console.error('Error closing position:', error);
      toast({
        title: "Error closing position",
        description: error.message || "Failed to close position",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold gradient-text">Portfolio</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-muted-foreground">Live prices</span>
              {isLive && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30 animate-pulse">
                  LIVE
                </Badge>
              )}
            </div>
            {lastUpdate > 0 && (
              <span className="text-xs text-primary/70">
                Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago
              </span>
            )}
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                  <p className="text-xl font-bold">${(totalInvestment / 84).toFixed(2)} USDT</p>
                  <p className="text-xs text-muted-foreground">₹{totalInvestment.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-xl font-bold">${(totalCurrentValue / 84).toFixed(2)} USDT</p>
                  <p className="text-xs text-muted-foreground">₹{totalCurrentValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                </div>
                <TrendingUpIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnL >= 0 ? '+' : ''}${(totalPnL / 84).toFixed(2)} USDT
                  </p>
                  <p className={`text-xs text-muted-foreground ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">P&L %</p>
                  <p className={`text-xl font-bold ${totalPnLPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%
                  </p>
                </div>
                <Percent className={`h-8 w-8 ${totalPnLPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Your Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground">Loading...</div>
            ) : updatedPositions && updatedPositions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
                {updatedPositions.map((position) => {
                  const isPositive = position.pnl >= 0;
                  return (
                    <div key={position.id} className="p-4 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <div>
                              <span className="font-semibold text-lg">{position.symbol}</span>
                              <p className="text-sm text-muted-foreground">{position.coin_name}</p>
                              <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded mt-1">
                                Min Trade: ${getMinimumAmount(position.symbol)} USDT
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Holdings</p>
                              <p className="font-medium">{Number(position.amount).toLocaleString("en-IN", { maximumFractionDigits: 6 })}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Avg Price</p>
                              <p className="font-medium">
                                ${(Number(position.buy_price) / 84).toFixed(2)} USDT
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₹{Number(position.buy_price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Current Price</p>
                              <p className="font-medium">
                                ${(Number(position.current_price) / 84).toFixed(2)} USDT
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₹{Number(position.current_price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Investment</p>
                              <p className="font-medium">
                                ${(Number(position.total_investment) / 84).toFixed(2)} USDT
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₹{Number(position.total_investment).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:items-end gap-3">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <p className="font-bold text-lg">
                              ${(position.current_value / 84).toFixed(2)} USDT
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ₹{position.current_value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}${(position.pnl / 84).toFixed(2)} USDT
                              </span>
                              <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}₹{position.pnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </span>
                              <Badge 
                                variant={isPositive ? "default" : "destructive"}
                                className={`text-xs ${
                                  isPositive 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {isPositive ? '+' : ''}{position.pnl_percentage.toFixed(2)}%
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              onClick={() => handleTradeClick(position)}
                              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                            >
                              Trade
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleClosePosition(position)}
                              className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none"
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                  <TrendingUpIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No holdings yet</p>
                <p className="text-muted-foreground/70 text-xs mt-1">Start trading to build your portfolio!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trading Modal */}
      {selectedCrypto && (
        <TradingModal
          isOpen={isTradingModalOpen}
          onClose={handleTradingModalClose}
          symbol={selectedCrypto.symbol}
          name={selectedCrypto.name}
          currentPrice={selectedCrypto.currentPrice}
        />
      )}
    </Layout>
  );
};

export default Portfolio;
