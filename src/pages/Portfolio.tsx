
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
  const { prices } = useLCWPrices();
  const { toast } = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState<{
    symbol: string;
    name: string;
    currentPrice: number;
  } | null>(null);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);

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

  // Update positions with live prices
  const updatedPositions = positions?.map(position => {
    const livePrice = prices[position.symbol]?.price || position.current_price;
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Live prices</span>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                  <p className="text-xl font-bold">₹{totalInvestment.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
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
                  <p className="text-xl font-bold">₹{totalCurrentValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
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

        {/* Holdings Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground">Loading...</div>
            ) : updatedPositions && updatedPositions.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Holdings</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Investment</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {updatedPositions.map((position) => {
                      const isPositive = position.pnl >= 0;
                      return (
                        <TableRow key={position.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold">{position.symbol}</span>
                              <span className="text-sm text-muted-foreground">{position.coin_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(position.amount).toLocaleString("en-IN", { maximumFractionDigits: 6 })}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{Number(position.buy_price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{Number(position.current_price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{Number(position.total_investment).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{position.current_value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
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
                          </TableCell>
                           <TableCell className="text-right">
                             <div className="flex gap-2 justify-end">
                               <Button
                                 size="sm"
                                 onClick={() => handleTradeClick(position)}
                                 className="bg-blue-600 hover:bg-blue-700"
                               >
                                 Trade
                               </Button>
                               <Button
                                 size="sm"
                                 variant="destructive"
                                 onClick={() => handleClosePosition(position)}
                                 className="bg-red-600 hover:bg-red-700"
                               >
                                 Close
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No holdings yet. Start trading to build your portfolio!
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
