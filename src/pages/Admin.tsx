
import { Layout } from "@/components/layout/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";
import { DepositRequestsTable } from "@/components/admin/DepositRequestsTable";
import { WithdrawalRequestsTable } from "@/components/admin/WithdrawalRequestsTable";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Admin = () => {
  const { isAdmin, isLoading } = useIsAdmin();

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Checking permissions...</div>
        ) : isAdmin ? (
          <Tabs defaultValue="deposits" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass">
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>

            <TabsContent value="deposits" className="space-y-4">
              <DepositRequestsTable />
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-4">
              <WithdrawalRequestsTable />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You don't have admin permissions. Please login with an admin account.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
