
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddFundsDialog } from "./AddFundsDialog";
import { useToast } from "@/hooks/use-toast";

type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
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
      // The admin_users_overview is a view; to avoid TS type issues with Supabase types, cast client to any
      const { data, error } = await (supabase as any)
        .from("admin_users_overview")
        .select("*")
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data as AdminUser[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (error) {
    console.error("Admin users overview error:", error);
    toast({
      title: "Failed to load users",
      description: (error as any)?.message || "Please try again.",
      variant: "destructive",
    });
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading...</div>
        ) : data && data.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registered</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
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
                    <TableCell className="whitespace-nowrap capitalize">{u.role}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      ₹{Number(u.wallet_balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <AddFundsDialog userId={u.id} userLabel={u.display_name || u.email || u.id} onSuccess={refetch} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">No users found</div>
        )}
      </CardContent>
    </Card>
  );
}
