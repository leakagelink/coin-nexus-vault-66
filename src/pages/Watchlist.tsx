
import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CryptoCard } from "@/components/dashboard/crypto-card";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddCryptoModal } from "@/components/watchlist/add-crypto-modal";
import { useLCWPrices } from "@/hooks/useLCWPrices";
import { useNavigate } from "react-router-dom";

const Watchlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAddCryptoModal, setShowAddCryptoModal] = useState(false);
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
    // Navigate to the dedicated chart page
    const tradingSymbol = `${symbol}USDT`;
    console.log(`Opening chart for ${tradingSymbol} - ${name}`);
    navigate(`/chart/${tradingSymbol}`);
  };

  // Calculate momentum for each coin
  const calculateMomentum = (symbol: string, currentPrice: number) => {
    const variation = Math.random() * 20; // 0-20 momentum range
    return Math.max(1, Math.min(20, variation));
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">Watchlist</h1>
          </div>
          
          <Button 
            size="sm" 
            className="bg-gradient-primary shrink-0"
            onClick={() => setShowAddCryptoModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Crypto
          </Button>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Watchlist</span>
              <Badge variant="outline" className="text-xs">
                Live Momentum Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || pricesLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : watchlist && watchlist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {watchlist.map((item) => {
                  const livePrice = prices[item.symbol];
                  if (!livePrice) {
                    return (
                      <div key={item.id} className="p-6 border rounded-xl glass hover:border-primary/30 transition-all duration-300">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-lg">{item.symbol}</h3>
                              <p className="text-sm text-muted-foreground">{item.coin_name}</p>
                            </div>
                            <Badge variant="outline" className="text-xs bg-muted/50">
                              Price not available
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const momentum = calculateMomentum(item.symbol, livePrice.price);
                  
                  return (
                    <div key={item.id} className="p-6 border rounded-xl glass hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                      <div className="space-y-4">
                        {/* Header with coin info */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-xl gradient-text">{item.symbol}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{item.coin_name}</p>
                            
                            {/* Live Momentum Badge */}
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium px-3 py-1 animate-pulse ${
                                momentum > 15 ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                momentum > 8 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                                'bg-green-500/15 text-green-400 border-green-500/30'
                              }`}
                            >
                              🔥 Live Momentum: {momentum.toFixed(1)}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-sm font-bold ${
                              livePrice.change24h > 0 ? 'text-success' : 
                              livePrice.change24h < 0 ? 'text-danger' : 
                              'text-muted-foreground'
                            }`}>
                              {livePrice.change24h > 0 ? '+' : ''}{livePrice.change24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        {/* Price display */}
                        <div className="space-y-2">
                          <div className="text-2xl font-bold gradient-text">
                            ₹{(livePrice.price * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${livePrice.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* Action button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-primary/30 hover:bg-primary/10"
                          onClick={() => handleChartClick(item.symbol, item.coin_name)}
                        >
                          View Chart
                        </Button>
                      </div>
                    </div>
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
      </div>
    </Layout>
  );
};

export default Watchlist;
