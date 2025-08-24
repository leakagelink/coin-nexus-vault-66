
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet as WalletIcon, Plus, Minus, History } from "lucide-react";

const Wallet = () => {
  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="flex items-center gap-2">
          <WalletIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold gradient-text">Wallet</h1>
        </div>

        <Card className="glass hover-glow">
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text mb-4">₹12,345.67</div>
            <div className="flex gap-3">
              <Button className="bg-gradient-success flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Deposit
              </Button>
              <Button variant="outline" className="flex-1">
                <Minus className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Deposit Funds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-2">🏦</span>
                    <span>UPI</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-2">💳</span>
                    <span>Bank Account</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-2">₮</span>
                    <span>USDT</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-2">🏦</span>
                    <span>UPI</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-2">💳</span>
                    <span>Bank Account</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-2">₮</span>
                    <span>USDT</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Wallet;
