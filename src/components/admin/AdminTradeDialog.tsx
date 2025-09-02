
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

interface AdminTradeDialogProps {
  userId: string;
  userLabel?: string;
  onSuccess?: () => void;
}

const POPULAR_COINS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'MATIC', name: 'Polygon' },
];

export function AdminTradeDialog({ userId, userLabel, onSuccess }: AdminTradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [quantity, setQuantity] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user balance when dialog opens
  useEffect(() => {
    if (!open || !userId) return;
    
    const fetchUserBalance = async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user balance:', error);
        setUserBalance(0);
      } else {
        setUserBalance(Number(data?.balance || 0));
      }
    };
    
    fetchUserBalance();
  }, [open, userId]);

  const selectedCoinData = POPULAR_COINS.find(coin => coin.symbol === selectedCoin);
  const parsedQty = parseFloat(quantity || '0');
  const parsedPrice = parseFloat(price || '0');
  const totalCost = parsedQty * parsedPrice;

  const handleSubmit = async () => {
    if (!user || !selectedCoin || !quantity || !price) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (parsedQty <= 0 || parsedPrice <= 0) {
      toast({
        title: "Invalid input",
        description: "Quantity and price must be positive",
        variant: "destructive"
      });
      return;
    }

    if (tradeType === 'buy' && userBalance < totalCost) {
      toast({
        title: "Insufficient balance",
        description: `User needs ₹${totalCost.toFixed(2)} but only has ₹${userBalance.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Check for existing position
      const { data: existingPosition } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', selectedCoin)
        .single();

      if (tradeType === 'buy') {
        if (existingPosition) {
          // Update existing position
          const oldQty = Number(existingPosition.amount);
          const newQty = oldQty + parsedQty;
          const newTotalInvestment = Number(existingPosition.total_investment || (oldQty * Number(existingPosition.buy_price))) + totalCost;
          const newAvgPrice = newQty > 0 ? newTotalInvestment / newQty : parsedPrice;

          const { error } = await supabase
            .from('portfolio_positions')
            .update({
              amount: newQty,
              buy_price: newAvgPrice,
              current_price: parsedPrice,
              total_investment: newTotalInvestment,
              current_value: newQty * parsedPrice,
              pnl: (newQty * parsedPrice) - newTotalInvestment,
              pnl_percentage: newTotalInvestment > 0 ? (((newQty * parsedPrice) - newTotalInvestment) / newTotalInvestment) * 100 : 0,
              position_type: positionType,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPosition.id);
          
          if (error) throw error;
        } else {
          // Create new position
          const { error } = await supabase
            .from('portfolio_positions')
            .insert({
              user_id: userId,
              symbol: selectedCoin,
              coin_name: selectedCoinData?.name || selectedCoin,
              amount: parsedQty,
              buy_price: parsedPrice,
              current_price: parsedPrice,
              total_investment: totalCost,
              current_value: parsedQty * parsedPrice,
              pnl: 0,
              pnl_percentage: 0,
              position_type: positionType,
              trade_type: 'buy',
            });
          
          if (error) throw error;
        }

        // Update user wallet (deduct money for buy)
        await supabase
          .from('wallets')
          .update({
            balance: userBalance - totalCost,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        // Handle sell
        if (!existingPosition) {
          throw new Error("No position found to sell");
        }

        if (Number(existingPosition.amount) < parsedQty) {
          throw new Error("Insufficient quantity to sell");
        }

        const newAmount = Number(existingPosition.amount) - parsedQty;
        const proceeds = parsedQty * parsedPrice;

        if (newAmount === 0) {
          // Close position
          await supabase
            .from('portfolio_positions')
            .delete()
            .eq('id', existingPosition.id);
        } else {
          // Update position
          const newTotalInvestment = Math.max(
            0,
            Number(existingPosition.total_investment || (Number(existingPosition.amount) * Number(existingPosition.buy_price))) -
              (parsedQty * Number(existingPosition.buy_price))
          );
          
          await supabase
            .from('portfolio_positions')
            .update({
              amount: newAmount,
              current_price: parsedPrice,
              current_value: newAmount * parsedPrice,
              total_investment: newTotalInvestment,
              pnl: (newAmount * parsedPrice) - newTotalInvestment,
              pnl_percentage: newTotalInvestment > 0 ? (((newAmount * parsedPrice) - newTotalInvestment) / newTotalInvestment) * 100 : 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPosition.id);
        }

        // Update user wallet (add money for sell)
        await supabase
          .from('wallets')
          .update({
            balance: userBalance + proceeds,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      // Record trade
      await supabase.from('trades').insert({
        user_id: userId,
        symbol: selectedCoin,
        coin_name: selectedCoinData?.name || selectedCoin,
        trade_type: tradeType,
        quantity: parsedQty,
        price: parsedPrice,
        total_amount: totalCost,
        status: 'completed',
      });

      toast({
        title: "Trade executed successfully",
        description: `${tradeType.toUpperCase()} ${parsedQty} ${selectedCoin} at ₹${parsedPrice} for ${userLabel}`,
      });

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['admin-users-overview'] });
      
      setOpen(false);
      setSelectedCoin("");
      setQuantity("");
      setPrice("");
      onSuccess?.();

    } catch (error: any) {
      console.error('Error executing trade:', error);
      toast({
        title: "Trade failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
          <TrendingUp className="h-4 w-4 mr-1" />
          Admin Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Execute Trade {userLabel ? `for ${userLabel}` : ""}</DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-4">
          User Balance: ₹{userBalance.toLocaleString("en-IN")}
        </div>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="coin-select">Select Coin</Label>
            <Select value={selectedCoin} onValueChange={setSelectedCoin}>
              <SelectTrigger>
                <SelectValue placeholder="Choose cryptocurrency" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_COINS.map((coin) => (
                  <SelectItem key={coin.symbol} value={coin.symbol}>
                    {coin.symbol} - {coin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Trade Type</Label>
              <Select value={tradeType} onValueChange={(value: 'buy' | 'sell') => setTradeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Buy
                    </div>
                  </SelectItem>
                  <SelectItem value="sell">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Sell
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Position Type</Label>
              <Select value={positionType} onValueChange={(value: 'long' | 'short') => setPositionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="e.g. 0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.000001"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g. 50000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
            />
          </div>

          {selectedCoin && quantity && price && (
            <div className="text-sm text-muted-foreground">
              Total: ₹{totalCost.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !selectedCoin || !quantity || !price}
            className={tradeType === 'buy' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {submitting ? "Processing..." : `${tradeType.toUpperCase()} ${selectedCoin || 'Coin'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
