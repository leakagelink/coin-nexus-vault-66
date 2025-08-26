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

const Portfolio = () => {
  const { user } = useAuth();
  const { prices } = useLCWPrices();
  const [showAddCryptoModal, setShowAddCryptoModal] = useState(false);

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', user?.id);
      
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
    return total + (position.amount * position.buy_price);
  }, 0) || 0;

  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const handleStartTrading = () => {
    setShowAddCryptoModal(true);
  };

  const handleAddPosition = () => {
    setShowAddCryptoModal(true);
  };

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
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P&L</p>
              <PriceDisplay
                price={totalValue}
                change={totalPnL}
                changePercent={totalPnLPercent}
                symbol="USD"
                size="lg"
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
                      const pnl = (livePrice - position.buy_price) * position.amount;
                      const pnlPercent = ((livePrice - position.buy_price) / position.buy_price) * 100;
                      
                      return (
                        <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg glass">
                          <div>
                            <h3 className="font-semibold">{position.symbol}</h3>
                            <p className="text-sm text-muted-foreground">{position.coin_name}</p>
                            <p className="text-sm">Amount: {position.amount}</p>
                          </div>
                          <div className="text-right">
                            <div className="mb-2">
                              <p className="text-lg font-bold">${(livePrice * position.amount).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">${livePrice.toFixed(4)} each</p>
                            </div>
                            <PriceDisplay
                              price={livePrice * position.amount}
                              change={pnl}
                              changePercent={pnlPercent}
                              symbol="USD"
                              size="sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Avg: ${position.buy_price.toFixed(4)}</p>
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
          onCryptoAdded={() => {}}
        />
      </div>
    </Layout>
  );
};

export default Portfolio;
