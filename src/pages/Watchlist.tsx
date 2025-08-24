
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CryptoCard } from "@/components/dashboard/crypto-card";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Watchlist = () => {
  const { user } = useAuth();

  const { data: watchlist, isLoading } = useQuery({
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

  // Mock data for crypto prices (in real app, this would come from an API)
  const getCryptoData = (symbol: string) => {
    const mockData: Record<string, any> = {
      'BTC': { price: 4325678, change: 125420, changePercent: 2.98 },
      'ETH': { price: 198765, change: -3245, changePercent: -1.61 },
      'USDT': { price: 83.45, change: 0.12, changePercent: 0.14 },
      'BNB': { price: 45632, change: 892, changePercent: 1.99 },
    };
    return mockData[symbol] || { price: 0, change: 0, changePercent: 0 };
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">Watchlist</h1>
          </div>
          <Button size="sm" className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Crypto
          </Button>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Your Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : watchlist && watchlist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchlist.map((item) => {
                  const cryptoData = getCryptoData(item.symbol);
                  return (
                    <CryptoCard
                      key={item.id}
                      symbol={item.symbol}
                      name={item.name}
                      price={cryptoData.price}
                      change={cryptoData.change}
                      changePercent={cryptoData.changePercent}
                      isWatchlisted={true}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No cryptocurrencies in your watchlist</p>
                <Button className="mt-4 bg-gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Crypto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Watchlist;
