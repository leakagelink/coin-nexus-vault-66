
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, X, TrendingUp, TrendingDown } from "lucide-react";
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
  status: string;
  created_at: string;
};

export function UserPositionsDialog({ userId, userLabel }: UserPositionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [closingPosition, setClosingPosition] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchPositions = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      console.log(`Fetching positions for user: ${userId}`);
      const { data, error } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
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
      
      console.log(`Found ${data?.length || 0} positions for user`);
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

  const closePosition = async (positionId: string, symbol: string, positionType: string) => {
    if (!user) return;
    
    setClosingPosition(positionId);
    try {
      console.log(`Admin closing position: ${positionId} for ${symbol} ${positionType}`);
      
      const position = positions.find(p => p.id === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Get current user balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = Number(walletData?.balance || 0);
      const proceeds = position.current_value;

      console.log(`Closing position with current value: ₹${proceeds}`);

      // Delete the position (close it)
      const { error: deleteError } = await supabase
        .from('portfolio_positions')
        .delete()
        .eq('id', positionId);

      if (deleteError) {
        console.error('Error deleting position:', deleteError);
        throw deleteError;
      }

      // Update user wallet (add proceeds from position closure)
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: currentBalance + proceeds,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (walletError) {
        console.error('Error updating wallet:', walletError);
        throw walletError;
      }

      // Record sell trade for the closure
      const { error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: userId,
          symbol: position.symbol,
          coin_name: position.coin_name,
          trade_type: 'sell',
          quantity: position.amount,
          price: position.current_price,
          total_amount: proceeds,
          status: 'completed',
        });

      if (tradeError) {
        console.error('Error recording trade:', tradeError);
        throw tradeError;
      }

      toast({
        title: "Position closed successfully",
        description: `Closed ${symbol} ${positionType} position and credited ₹${proceeds.toFixed(2)} to user`,
      });

      console.log(`Position closed successfully, credited ₹${proceeds} to user wallet`);

      // Refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-users-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
        queryClient.invalidateQueries({ queryKey: ['trades'] }),
      ]);
      
      // Refresh positions list
      fetchPositions();

    } catch (error: any) {
      console.error('Error closing position:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to close position",
        variant: "destructive"
      });
    } finally {
      setClosingPosition(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" />
          Positions ({positions.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            Open Positions {userLabel ? `for ${userLabel}` : ""} ({positions.length})
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
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Buy Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Investment</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
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
                    <TableCell>
                      <Badge 
                        variant={position.position_type === 'long' ? 'default' : 'secondary'}
                        className={`capitalize ${
                          position.position_type === 'long' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {position.position_type === 'long' ? (
                          <><TrendingUp className="h-3 w-3 mr-1" /> Long</>
                        ) : (
                          <><TrendingDown className="h-3 w-3 mr-1" /> Short</>
                        )}
                      </Badge>
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
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => closePosition(position.id, position.symbol, position.position_type)}
                        disabled={closingPosition === position.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {closingPosition === position.id ? 'Closing...' : 'Close'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No open positions found</p>
            <p className="text-sm mt-2">User has no open trading positions</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
