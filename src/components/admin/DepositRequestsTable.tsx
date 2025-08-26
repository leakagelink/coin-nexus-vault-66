
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { BadgeCheck, XCircle } from "lucide-react";

interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_reference: string | null;
  approved_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  wallet_updated: boolean | null;
}

export function DepositRequestsTable() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-deposit-requests"],
    queryFn: async () => {
      // Admin can view all, per RLS policy
      const { data, error } = await supabase
        .from("deposit_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DepositRequest[];
    },
  });

  const approve = async (id: string) => {
    if (!user) return;
    console.log("Approving deposit", id);
    
    try {
      // Get the deposit request details first
      const { data: depositRequest, error: fetchError } = await supabase
        .from("deposit_requests")
        .select("*")
        .eq("id", id)
        .eq("status", "pending")
        .single();

      if (fetchError || !depositRequest) {
        console.error("Fetch deposit error:", fetchError);
        toast({
          title: "Approval failed",
          description: "Deposit request not found or already processed",
          variant: "destructive",
        });
        return;
      }

      // Update deposit request status
      const { error: updateError } = await supabase
        .from("deposit_requests")
        .update({
          status: "approved",
          approved_by: user.id,
          processed_at: new Date().toISOString(),
          wallet_updated: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (updateError) {
        console.error("Update deposit error:", updateError);
        toast({
          title: "Approval failed",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Check if wallet exists, create if not
      const { data: existingWallet, error: walletCheckError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', depositRequest.user_id)
        .single();

      if (walletCheckError && walletCheckError.code !== 'PGRST116') {
        console.error("Wallet check error:", walletCheckError);
        toast({
          title: "Approval failed",
          description: "Error checking user wallet",
          variant: "destructive",
        });
        return;
      }

      // Update or create wallet
      if (!existingWallet) {
        // Create new wallet
        const { error: createWalletError } = await supabase
          .from('wallets')
          .insert({
            user_id: depositRequest.user_id,
            balance: depositRequest.amount,
            currency: 'INR'
          });

        if (createWalletError) {
          console.error("Create wallet error:", createWalletError);
          toast({
            title: "Approval failed",
            description: "Error creating user wallet",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Update existing wallet
        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({
            balance: existingWallet.balance + depositRequest.amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', depositRequest.user_id);

        if (updateWalletError) {
          console.error("Update wallet error:", updateWalletError);
          toast({
            title: "Approval failed",
            description: "Error updating user wallet",
            variant: "destructive",
          });
          return;
        }
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: depositRequest.user_id,
          transaction_type: 'deposit',
          amount: depositRequest.amount,
          total_value: depositRequest.amount,
          status: 'completed'
        });

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        // Don't fail the whole operation for transaction logging
      }

      toast({
        title: "Deposit approved",
        description: "Wallet updated and transaction recorded.",
      });
      refetch();

    } catch (error: any) {
      console.error("Approve deposit error:", error);
      toast({
        title: "Approval failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const reject = async (id: string) => {
    if (!user) return;
    console.log("Rejecting deposit", id);
    
    const { error } = await supabase
      .from("deposit_requests")
      .update({
        status: "rejected",
        approved_by: user.id,
        admin_notes: "Rejected by admin",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      console.error("Reject deposit error:", error);
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Deposit rejected",
      description: "The request has been marked as rejected.",
    });
    refetch();
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Deposit Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading...</div>
        ) : data && data.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(req.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs break-all">{req.user_id}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      ₹{Number(req.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{req.payment_method}</TableCell>
                    <TableCell className="whitespace-nowrap capitalize">
                      {req.status}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-gradient-success"
                          disabled={req.status !== "pending"}
                          onClick={() => approve(req.id)}
                        >
                          <BadgeCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={req.status !== "pending"}
                          onClick={() => reject(req.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1 text-destructive" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">No requests found</div>
        )}
      </CardContent>
    </Card>
  );
}
