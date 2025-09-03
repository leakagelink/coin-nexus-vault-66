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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-deposit-requests", user?.id],
    queryFn: async () => {
      // Admin can view all, per RLS policy
      const { data, error } = await supabase
        .from("deposit_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DepositRequest[];
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const approve = async (id: string) => {
    if (!user) return;
    console.log("Approving deposit via RPC", id);
    
    try {
      // Use SECURITY DEFINER RPC for atomic approval + wallet update + transaction logging
      const { data, error } = await supabase.rpc("process_deposit_approval", {
        deposit_id: id,
        admin_id: user.id,
      });

      if (error) {
        console.error("process_deposit_approval RPC error:", error);
        toast({
          title: "Approval failed",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
        return;
      }

      console.log("Deposit approved via RPC", data);
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
