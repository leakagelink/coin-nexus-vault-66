import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CryptoCard } from "@/components/dashboard/crypto-card";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddCryptoModal } from "@/components/watchlist/add-crypto-modal";
import { ChartModal } from "@/components/charts/chart-modal";
import { useLCWPrices } from "@/hooks/useLCWPrices";

const Watchlist = () => {
  const { user } = useAuth();
  const [showAddCryptoModal, setShowAddCryptoModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState<{ symbol: string; name: string } | null>(null);
  const { prices, isLoading: pricesLoading } = useLCWPrices();

  const { data: watchlist, isLoading, refetch } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleCryptoAdded = () => {
    refetch();
  };

  const handleChartClick = (symbol: string, name: string) => {
    // Convert to trading pair format for TaapiAPI
    const tradingSymbol = `${symbol}USDT`;
    console.log(`Opening enhanced chart for ${tradingSymbol} - ${name}`);
    setSelectedChart({ symbol: tradingSymbol, name });
  };

  const handleCloseChart = () => {
    setSelectedChart(null);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">Watchlist</h1>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-primary"
            onClick={() => setShowAddCryptoModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Crypto
          </Button>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Your Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || pricesLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : watchlist && watchlist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchlist.map((item) => {
                  const livePrice = prices[item.symbol];
                  if (!livePrice) {
                    return (
                      <div key={item.id} className="p-4 border rounded-lg glass">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{item.symbol}</h3>
                            <p className="text-sm text-muted-foreground">{item.coin_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Price not available</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <CryptoCard
                      key={item.id}
                      symbol={item.symbol}
                      name={item.coin_name}
                      price={livePrice.price}
                      change={livePrice.change24h}
                      changePercent={livePrice.change24h}
                      isWatchlisted={true}
                      onChartClick={() => handleChartClick(item.symbol, item.coin_name)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No cryptocurrencies in your watchlist</p>
                <Button 
                  className="mt-4 bg-gradient-primary"
                  onClick={() => setShowAddCryptoModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Crypto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <AddCryptoModal
          isOpen={showAddCryptoModal}
          onClose={() => setShowAddCryptoModal(false)}
          onCryptoAdded={handleCryptoAdded}
        />

        {selectedChart && (
          <ChartModal
            isOpen={!!selectedChart}
            onClose={handleCloseChart}
            symbol={selectedChart.symbol}
            name={selectedChart.name}
          />
        )}
      </div>
    </Layout>
  );
};

export default Watchlist;
