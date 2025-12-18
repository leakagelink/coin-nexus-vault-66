
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, X, TrendingUp, Plus, Minus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { usePriceData } from "@/hooks/usePriceData";
import { usePositionCalculations } from "@/hooks/usePositionCalculations";

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
  created_at: string;
  admin_adjustment_pct?: number;
  admin_price_override?: boolean;
};

export function UserPositionsDialog({ userId, userLabel }: UserPositionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [closingPosition, setClosingPosition] = useState<string | null>(null);
  const [adjustingPosition, setAdjustingPosition] = useState<string | null>(null);
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

  // Get symbols for live prices
  const symbolsForPrices = positions.map(p => p.symbol);
  const { prices: livePrices } = usePriceData(symbolsForPrices);
  
  // Calculate live P&L for display
  const displayPositions = usePositionCalculations(positions, livePrices);

  const adjustPnlPercentage = async (positionId: string, percentageChange: number) => {
    if (!user) return;
    
    setAdjustingPosition(positionId);
    try {
      const position = positions.find(p => p.id === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Base on current stored P&L% to ensure exact ±5% steps per click
      const currentFinalPct = Number(position.pnl_percentage) || 0;
      const targetFinalPct = currentFinalPct + percentageChange; // desired final P&L%

      const buyPrice = Number(position.buy_price) || 0;
      if (buyPrice <= 0) {
        throw new Error('Invalid buy price for position');
      }

      // IMPORTANT: Always use long-style formula to match DB trigger logic
      // DB trigger computes: pnl% = ((current_price - buy_price) / buy_price) * 100
      const newCurrentPrice = buyPrice * (1 + targetFinalPct / 100);

      // Ensure price doesn't go below a minimal positive value
      const safeCurrentPrice = Math.max(0.01, Number(newCurrentPrice.toFixed(2)));

      // Update position: set the derived current_price directly
      // The database trigger will automatically calculate current_value, pnl, and pnl_percentage
      const { error } = await supabase
        .from('portfolio_positions')
        .update({
          current_price: safeCurrentPrice,
          admin_price_override: true, // Prevent live updates from overriding admin edits
          admin_adjustment_pct: 0, // Use price override only for exact ±5% steps
          updated_at: new Date().toISOString(),
        })
        .eq('id', positionId);

      if (error) throw error;

      toast({
        title: "P&L updated",
        description: `${percentageChange > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(percentageChange)}%`,
      });

      // Refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-users-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio-positions'] }),
        queryClient.invalidateQueries({ queryKey: ['trades'] }),
      ]);
      
      fetchPositions();

    } catch (error: any) {
      console.error('Error adjusting position:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to adjust position",
        variant: "destructive"
      });
    } finally {
      setAdjustingPosition(null);
    }
  };

  const closePosition = async (positionId: string, symbol: string) => {
    if (!user) return;
    
    setClosingPosition(positionId);
    try {
      console.log(`Admin closing position: ${positionId} for ${symbol}`);
      
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
      
      // Calculate proceeds using current price and amount to get the correct value after admin edits
      const proceeds = position.amount * position.current_price;

      console.log(`Closing position with calculated proceeds: ₹${proceeds}`);

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
        description: `Closed ${symbol} position and credited ₹${proceeds.toFixed(2)} to user`,
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
                  <TableHead>P&L Adjust</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{position.symbol}</div>
                        <div className="text-xs text-muted-foreground">{position.coin_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <TrendingUp className="h-3 w-3 mr-1" /> Hold
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(position.amount).toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{Number(position.buy_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{Number(position.current_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{Number(position.total_investment).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{Number(position.current_value).toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${Number(position.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Number(position.pnl).toFixed(2)}
                      <div className="text-xs">
                        ({Number(position.pnl_percentage).toFixed(2)}%)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustPnlPercentage(position.id, 5)}
                          disabled={adjustingPosition === position.id}
                          className="text-green-600 hover:text-green-700"
                          title="Increase P&L by 5%"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                           onClick={() => adjustPnlPercentage(position.id, -5)}
                          disabled={adjustingPosition === position.id}
                          className="text-red-600 hover:text-red-700"
                          title="Decrease P&L by 5%"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => closePosition(position.id, position.symbol)}
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
