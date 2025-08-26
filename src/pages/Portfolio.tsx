import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PriceDisplay } from "@/components/ui/price-display";
import { useLCWPrices } from "@/hooks/useLCWPrices";
import { AddCryptoModal } from "@/components/watchlist/add-crypto-modal";
import { useToast } from "@/hooks/use-toast";

const Portfolio = () => {
  const { user } = useAuth();
  const { prices } = useLCWPrices();
  const [showAddCryptoModal, setShowAddCryptoModal] = useState(false);
  const { toast } = useToast();

  const { data: portfolio, isLoading, refetch } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate total portfolio value using LiveCoinWatch prices
  const totalValue = portfolio?.reduce((total, position) => {
    const livePrice = prices[position.symbol]?.price || position.current_price;
    return total + (position.amount * livePrice);
  }, 0) || 0;

  const totalCost = portfolio?.reduce((total, position) => {
    return total + (position.total_investment || (position.amount * position.buy_price));
  }, 0) || 0;

  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const handleStartTrading = () => {
    setShowAddCryptoModal(true);
  };

  const handleAddPosition = () => {
    setShowAddCryptoModal(true);
  };

  const closePosition = async (position: any) => {
    if (!user) return;
    
    const symbol = position.symbol;
    const livePrice = prices[symbol]?.price || position.current_price;
    const qty = Number(position.amount);
    const proceeds = qty * livePrice;
    const currentBalance = Number(walletData?.balance || 0);

    try {
      // Credit wallet with proceeds
      const { error: walletErr } = await supabase
        .from('wallets')
        .update({
          balance: currentBalance + proceeds,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (walletErr) throw walletErr;

      // Insert sell trade record
      const { error: tradeErr } = await supabase.from('trades').insert({
        user_id: user.id,
        symbol,
        coin_name: position.coin_name,
        trade_type: 'sell',
        quantity: qty,
        price: livePrice,
        total_amount: proceeds,
        status: 'completed',
      });
      if (tradeErr) throw tradeErr;

      // Delete position
      const { error: posErr } = await supabase
        .from('portfolio_positions')
        .delete()
        .eq('id', position.id);
      if (posErr) throw posErr;

      const pnl = proceeds - (position.total_investment || (qty * position.buy_price));
      const pnlPercent = position.total_investment > 0 ? (pnl / position.total_investment) * 100 : 0;

      toast({
        title: 'Position closed',
        description: `Sold ${qty.toFixed(6)} ${symbol} at ${livePrice.toFixed(4)} USDT. P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`,
      });

      refetch();
    } catch (e) {
      console.error('Error closing position:', e);
      toast({
        title: 'Error',
        description: 'Failed to close position',
        variant: 'destructive',
      });
    }
  };

  // USD to INR conversion rate
  const usdToInrRate = 84;

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">Portfolio</h1>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-primary"
            onClick={handleAddPosition}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <div className="flex flex-col">
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
                <p className="text-lg text-muted-foreground">₹{(totalValue * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <div className="flex flex-col">
                <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                <p className="text-lg text-muted-foreground">₹{(totalCost * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <div className="flex flex-col">
                <p className="text-2xl font-bold">${Number(walletData?.balance || 0).toFixed(2)}</p>
                <p className="text-lg text-muted-foreground">₹{(Number(walletData?.balance || 0) * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P&L</p>
              <PriceDisplay
                price={totalValue}
                change={totalPnL}
                changePercent={totalPnLPercent}
                symbol="USD"
                size="lg"
                showDualCurrency={true}
                usdtPrice={totalValue}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-4 glass">
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="bulk-trade">Bulk Trade</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Active Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : portfolio && portfolio.length > 0 ? (
                  <div className="space-y-4">
                    {portfolio.map((position) => {
                      const livePrice = prices[position.symbol]?.price || position.current_price;
                      const totalInvestment = position.total_investment || (position.amount * position.buy_price);
                      const currentValue = position.amount * livePrice;
                      const pnl = currentValue - totalInvestment;
                      const pnlPercent = totalInvestment > 0 ? (pnl / totalInvestment) * 100 : 0;
                      
                      return (
                        <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg glass">
                          <div>
                            <h3 className="font-semibold">{position.symbol}</h3>
                            <p className="text-sm text-muted-foreground">{position.coin_name}</p>
                            <p className="text-sm">Amount: {Number(position.amount).toFixed(6)}</p>
                            <div className="text-xs text-muted-foreground">
                              <div>Avg: ${Number(position.buy_price).toFixed(4)}</div>
                              <div>₹{(Number(position.buy_price) * usdToInrRate).toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="mb-2">
                              <div className="flex flex-col">
                                <p className="text-lg font-bold">${currentValue.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">₹{(currentValue * usdToInrRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <div>${livePrice.toFixed(4)} each</div>
                                <div>₹{(livePrice * usdToInrRate).toFixed(2)} each</div>
                              </div>
                            </div>
                            <PriceDisplay
                              price={currentValue}
                              change={pnl}
                              changePercent={pnlPercent}
                              symbol="USD"
                              size="sm"
                              showDualCurrency={true}
                              usdtPrice={currentValue}
                            />
                            <div className="mt-3">
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => closePosition(position)}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active positions</p>
                    <Button 
                      className="mt-4 bg-gradient-primary"
                      onClick={handleStartTrading}
                    >
                      Start Trading
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holdings" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No holdings found</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-trade" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Bulk Trade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No bulk trades</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="closed" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Closed Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No closed positions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddCryptoModal
          isOpen={showAddCryptoModal}
          onClose={() => setShowAddCryptoModal(false)}
          onCryptoAdded={() => {
            refetch();
            setShowAddCryptoModal(false);
          }}
          mode="trading"
        />
      </div>
    </Layout>
  );
};

export default Portfolio;
