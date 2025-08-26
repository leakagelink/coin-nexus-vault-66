
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ArrowUpRight, ArrowDownLeft, Plus, Minus } from "lucide-react";

export function TransactionHistory() {
  const { user } = useAuth();

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["user-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch deposit requests
  const { data: depositRequests } = useQuery({
    queryKey: ["user-deposit-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposit_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch withdrawal requests
  const { data: withdrawalRequests } = useQuery({
    queryKey: ["user-withdrawal-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Combine all transactions
  const allTransactions = [
    ...(transactions || []).map(t => ({
      ...t,
      type: 'transaction',
      status: t.status || 'completed'
    })),
    ...(depositRequests || []).map(d => ({
      ...d,
      type: 'deposit_request',
      transaction_type: 'deposit',
      created_at: d.created_at
    })),
    ...(withdrawalRequests || []).map(w => ({
      ...w,
      type: 'withdrawal_request',
      transaction_type: 'withdrawal',
      created_at: w.created_at
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: "default" as const, color: "text-green-600" },
      pending: { variant: "secondary" as const, color: "text-yellow-600" },
      approved: { variant: "default" as const, color: "text-green-600" },
      rejected: { variant: "destructive" as const, color: "text-red-600" },
      failed: { variant: "destructive" as const, color: "text-red-600" }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'admin_credit':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'buy':
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
      case 'sell':
        return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allTransactions && allTransactions.length > 0 ? (
          <div className="space-y-3">
            {allTransactions.map((transaction) => {
              const statusConfig = getStatusBadge(transaction.status);
              return (
                <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <p className="font-medium capitalize">
                        {transaction.transaction_type === 'admin_credit' ? 'Admin Credit' : transaction.transaction_type}
                        {transaction.type === 'deposit_request' && ' Request'}
                        {transaction.type === 'withdrawal_request' && ' Request'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('en-IN')} • {new Date(transaction.created_at).toLocaleTimeString('en-IN')}
                        </p>
                        <Badge variant={statusConfig.variant} className={statusConfig.color}>
                          {transaction.status}
                        </Badge>
                      </div>
                      {(transaction.type === 'deposit_request' || transaction.type === 'withdrawal_request') && 'payment_method' in transaction && transaction.payment_method && (
                        <p className="text-xs text-muted-foreground">via {transaction.payment_method}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      ['deposit', 'admin_credit'].includes(transaction.transaction_type) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {['deposit', 'admin_credit'].includes(transaction.transaction_type) ? '+' : '-'}₹{Number(transaction.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {['deposit', 'admin_credit'].includes(transaction.transaction_type) ? '+' : '-'}${(Number(transaction.amount) / 84).toFixed(2)} USDT
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
