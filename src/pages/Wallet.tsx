
import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet as WalletIcon, Plus, Minus, History } from "lucide-react";
import { DepositModal } from "@/components/wallet/deposit-modal";
import { WithdrawalModal } from "@/components/wallet/withdrawal-modal";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Wallet = () => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const { user } = useAuth();

  const { data: wallet, isLoading: balanceLoading } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const handleDepositMethod = (method: string) => {
    setSelectedMethod(method);
    setDepositModalOpen(true);
  };

  const handleWithdrawMethod = (method: string) => {
    setSelectedMethod(method);
    setWithdrawalModalOpen(true);
  };

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
            <div className="text-3xl font-bold gradient-text mb-4">
              {balanceLoading ? "Loading..." : `₹${Number(wallet?.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
            </div>
            <div className="flex gap-3">
              <Button className="bg-gradient-success flex-1" onClick={() => setDepositModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Deposit
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setWithdrawalModalOpen(true)}>
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
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleDepositMethod('UPI')}
                  >
                    <span className="text-2xl mb-2">🏦</span>
                    <span>UPI</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleDepositMethod('Bank Account')}
                  >
                    <span className="text-2xl mb-2">💳</span>
                    <span>Bank Account</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleDepositMethod('USDT')}
                  >
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
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleWithdrawMethod('UPI')}
                  >
                    <span className="text-2xl mb-2">🏦</span>
                    <span>UPI</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleWithdrawMethod('Bank Account')}
                  >
                    <span className="text-2xl mb-2">💳</span>
                    <span>Bank Account</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => handleWithdrawMethod('USDT')}
                  >
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

        <DepositModal
          isOpen={depositModalOpen}
          onClose={() => setDepositModalOpen(false)}
          method={selectedMethod}
        />

        <WithdrawalModal
          isOpen={withdrawalModalOpen}
          onClose={() => setWithdrawalModalOpen(false)}
          method={selectedMethod}
        />
      </div>
    </Layout>
  );
};

export default Wallet;
