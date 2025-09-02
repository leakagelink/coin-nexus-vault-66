
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

interface UserPositionsDialogProps {
  userId: string;
  userLabel?: string;
}

type Position = {
  id: string;
  symbol: string;
  coin_name: string;
  amount: number;
  buy_price: number;
  current_price: number;
  total_investment: number;
  current_value: number;
  pnl: number;
  pnl_percentage: number;
  position_type: string;
  created_at: string;
};

export function UserPositionsDialog({ userId, userLabel }: UserPositionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchPositions = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching positions:', error);
        toast({
          title: "Error",
          description: "Failed to load positions",
          variant: "destructive"
        });
        return;
      }
      
      setPositions(data || []);
    } catch (error) {
      console.error('Exception fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPositions();
    }
  }, [open, userId]);

  const closePosition = async (positionId: string, symbol: string) => {
    if (!user) return;
    
    try {
      const position = positions.find(p => p.id === positionId);
      if (!position) return;

      // Get current user balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = Number(walletData?.balance || 0);
      const proceeds = position.current_value;

      // Delete position
      const { error: deleteError } = await supabase
        .from('portfolio_positions')
        .delete()
        .eq('id', positionId);

      if (deleteError) throw deleteError;

      // Update user wallet (add proceeds)
      await supabase
        .from('wallets')
        .update({
          balance: currentBalance + proceeds,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Record sell trade
      await supabase.from('trades').insert({
        user_id: userId,
        symbol: position.symbol,
        coin_name: position.coin_name,
        trade_type: 'sell',
        quantity: position.amount,
        price: position.current_price,
        total_amount: proceeds,
        status: 'completed',
      });

      toast({
        title: "Position closed",
        description: `Closed ${symbol} position and credited ₹${proceeds.toFixed(2)} to user`,
      });

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['admin-users-overview'] });
      fetchPositions();

    } catch (error: any) {
      console.error('Error closing position:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to close position",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" />
          Positions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Positions {userLabel ? `for ${userLabel}` : ""} ({positions.length})
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">Loading positions...</div>
        ) : positions.length > 0 ? (
          <div className="w-full overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coin</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Buy Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Investment</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{position.symbol}</div>
                        <div className="text-xs text-muted-foreground">{position.coin_name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{Number(position.amount).toFixed(6)}</TableCell>
                    <TableCell className="text-right">₹{Number(position.buy_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{Number(position.current_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{Number(position.total_investment).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{Number(position.current_value).toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${Number(position.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Number(position.pnl).toFixed(2)}
                      <div className="text-xs">
                        ({Number(position.pnl_percentage).toFixed(2)}%)
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{position.position_type}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => closePosition(position.id, position.symbol)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No positions found</p>
            <p className="text-sm mt-2">User has no open positions</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
