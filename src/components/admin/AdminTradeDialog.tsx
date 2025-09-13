
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
import { useLCWPrices } from "@/hooks/useLCWPrices";

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
  const { prices } = useLCWPrices();

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

  // Auto-populate price when coin is selected
  useEffect(() => {
    if (selectedCoin && prices[selectedCoin]?.price) {
      const livePrice = prices[selectedCoin].price * 84; // Convert to INR
      setPrice(livePrice.toFixed(2));
    }
  }, [selectedCoin, prices]);

  // Get current live price for calculations
  const getCurrentLivePrice = (symbol: string): number => {
    const livePrice = prices[symbol]?.price;
    return livePrice ? livePrice * 84 : parseFloat(price || '0');
  };

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

    // For buy trades, check if user has sufficient balance
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
      console.log(`Admin executing ${tradeType} ${positionType} position: ${parsedQty} ${selectedCoin} at ₹${parsedPrice} for user ${userId}`);

      // IMPORTANT FIX: use maybeSingle() so that "no rows" doesn't throw an error
      const { data: existingPosition, error: existingErr } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', selectedCoin)
        .eq('position_type', positionType)
        .maybeSingle();

      if (existingErr) {
        console.warn('Existing position lookup returned error (will treat as no existing position if benign):', existingErr);
      }

      if (tradeType === 'buy') {
        if (existingPosition) {
          // Update existing position - add to quantity and recalculate average price
          const oldQty = Number(existingPosition.amount || 0);
          const newQty = oldQty + parsedQty;
          const oldInvestment = Number(
            existingPosition.total_investment ??
            (oldQty * Number(existingPosition.buy_price || 0))
          );
          const newTotalInvestment = oldInvestment + totalCost;
          const newAvgPrice = newQty > 0 ? newTotalInvestment / newQty : parsedPrice;
          
          // Use live price for current calculations
          const currentPrice = getCurrentLivePrice(selectedCoin);
          const currentValue = newQty * currentPrice;
          const pnl = currentValue - newTotalInvestment;
          const pnlPercentage = newTotalInvestment > 0 ? (pnl / newTotalInvestment) * 100 : 0;

          const { error } = await supabase
            .from('portfolio_positions')
            .update({
              amount: newQty,
              buy_price: newAvgPrice,
              current_price: currentPrice,
              total_investment: newTotalInvestment,
              current_value: currentValue,
              pnl: pnl,
              pnl_percentage: pnlPercentage,
              updated_at: new Date().toISOString(),
              status: 'open',
            })
            .eq('id', existingPosition.id);
          
          if (error) {
            console.error('Error updating existing position:', error);
            throw error;
          }
          
          console.log(`Updated existing ${positionType} position for ${selectedCoin}`);
        } else {
          // Create new position with live price
          const currentPrice = getCurrentLivePrice(selectedCoin);
          const currentValue = parsedQty * currentPrice;
          const pnl = currentValue - totalCost;
          const pnlPercentage = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
          
          const positionData = {
            user_id: userId,
            symbol: selectedCoin,
            coin_name: selectedCoinData?.name || selectedCoin,
            amount: parsedQty,
            buy_price: parsedPrice,
            current_price: currentPrice,
            total_investment: totalCost,
            current_value: currentValue,
            pnl: pnl,
            pnl_percentage: pnlPercentage,
            position_type: positionType,
            status: 'open',
            trade_type: 'buy',
          };

          console.log('Creating new position with data:', positionData);

          const { error } = await supabase
            .from('portfolio_positions')
            .insert(positionData);
          
          if (error) {
            console.error('Error creating new position:', error);
            throw error;
          }
          
          console.log(`Created new ${positionType} position for ${selectedCoin}`);
        }

        // Deduct money from user wallet for buy order
        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            balance: userBalance - totalCost,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (walletError) {
          console.error('Error updating wallet:', walletError);
          throw walletError;
        }

        console.log(`Deducted ₹${totalCost} from user wallet`);
      } else {
        // Handle sell (close position)
        if (!existingPosition) {
          throw new Error(`No ${positionType} position found for ${selectedCoin} to sell`);
        }

        if (Number(existingPosition.amount) < parsedQty) {
          throw new Error("Insufficient quantity to sell");
        }

        const newAmount = Number(existingPosition.amount) - parsedQty;
        const proceeds = parsedQty * parsedPrice;

        if (newAmount === 0) {
          // Close position completely
          const { error } = await supabase
            .from('portfolio_positions')
            .delete()
            .eq('id', existingPosition.id);
          
          if (error) throw error;
          console.log(`Completely closed ${positionType} position for ${selectedCoin}`);
        } else {
          // Partially close position
          const oldInvestment = Number(
            existingPosition.total_investment ?? 
            (Number(existingPosition.amount) * Number(existingPosition.buy_price))
          );
          const newTotalInvestment = Math.max(0, oldInvestment - (parsedQty * Number(existingPosition.buy_price)));
          
          const { error } = await supabase
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
          
          if (error) throw error;
          console.log(`Partially closed ${positionType} position for ${selectedCoin}`);
        }

        // Add proceeds to user wallet for sell order
        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            balance: userBalance + proceeds,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (walletError) {
          console.error('Error updating wallet after sell:', walletError);
          throw walletError;
        }

        console.log(`Added ₹${proceeds} to user wallet from sell`);
      }

      // Record the trade in trades table
      const tradeData = {
        user_id: userId,
        symbol: selectedCoin,
        coin_name: selectedCoinData?.name || selectedCoin,
        trade_type: tradeType,
        quantity: parsedQty,
        price: parsedPrice,
        total_amount: totalCost,
        status: 'completed',
      };

      console.log('Recording trade with data:', tradeData);

      const { error: tradeError } = await supabase
        .from('trades')
        .insert(tradeData);

      if (tradeError) {
        console.error('Error recording trade:', tradeError);
        throw tradeError;
      }

      toast({
        title: "Trade executed successfully",
        description: `${tradeType.toUpperCase()} ${positionType.toUpperCase()}: ${parsedQty} ${selectedCoin} at ₹${parsedPrice} for ${userLabel}`,
      });

      // Refresh all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-users-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
        queryClient.invalidateQueries({ queryKey: ['trades'] }),
      ]);
      
      // Reset form and close dialog
      setOpen(false);
      setSelectedCoin("");
      setQuantity("");
      setPrice("");
      setTradeType('buy');
      setPositionType('long');
      
      onSuccess?.();

    } catch (error: any) {
      console.error('Error executing admin trade:', error);
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
                      Buy/Open
                    </div>
                  </SelectItem>
                  <SelectItem value="sell">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Sell/Close
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
              <div className="text-xs mt-1">
                Action: {tradeType === 'buy' ? 'Open' : 'Close'} {positionType} position
              </div>
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
