
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddFundsDialog } from "./AddFundsDialog";
import { EditBalanceDialog } from "./EditBalanceDialog";
import { AdminTradeDialog } from "./AdminTradeDialog";
import { UserPositionsDialog } from "./UserPositionsDialog";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  mobile_number: string | null;
  role: string;
  registered_at: string;
  wallet_balance: number;
  currency: string | null;
  wallet_last_updated: string | null;
};

export function AdminUsersTable() {
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users-overview"],
    queryFn: async () => {
      console.log("Fetching admin users overview...");
      
      // Query the profiles table with wallet data joined
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          display_name,
          mobile_number,
          role,
          created_at,
          wallets(balance, currency, updated_at)
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Query error:", error);
        throw error;
      }
      
      console.log("Raw profiles data:", data);
      
      // Transform the data to match AdminUser type
      const transformedData: AdminUser[] = data.map(profile => {
        // Handle the case where wallets is an array or a single object
        const wallet = Array.isArray(profile.wallets) 
          ? profile.wallets[0] 
          : profile.wallets;
        
        return {
          id: profile.id,
          email: profile.email,
          display_name: profile.display_name,
          mobile_number: profile.mobile_number,
          role: profile.role,
          registered_at: profile.created_at,
          wallet_balance: Number(wallet?.balance || 0),
          currency: wallet?.currency || 'INR',
          wallet_last_updated: wallet?.updated_at || null,
        };
      });
      
      console.log("Transformed data:", transformedData);
      return transformedData;
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds to keep data fresh
  });

  // Move error handling to useEffect to prevent re-render loops
  useEffect(() => {
    if (error) {
      console.error("Admin users overview error:", error);
      toast({
        title: "Failed to load users",
        description: (error as any)?.message || "Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDataUpdate = async () => {
    console.log("Data updated, refetching user data...");
    await refetch();
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Users ({data?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading users...</div>
        ) : data && data.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registered</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(u.registered_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{u.display_name || "-"}</TableCell>
                    <TableCell className="text-xs break-all">{u.email || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">{u.mobile_number || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap capitalize">{u.role}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      ₹{Number(u.wallet_balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <AddFundsDialog 
                          userId={u.id} 
                          userLabel={u.display_name || u.email || u.id} 
                          onSuccess={handleDataUpdate} 
                        />
                        <EditBalanceDialog
                          userId={u.id}
                          currentBalance={u.wallet_balance}
                          userLabel={u.display_name || u.email || u.id}
                          onSuccess={handleDataUpdate}
                        />
                        <AdminTradeDialog
                          userId={u.id}
                          userLabel={u.display_name || u.email || u.id}
                          onSuccess={handleDataUpdate}
                        />
                        <UserPositionsDialog
                          userId={u.id}
                          userLabel={u.display_name || u.email || u.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No users found</p>
            <p className="text-sm mt-2">New users will appear here after registration</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
