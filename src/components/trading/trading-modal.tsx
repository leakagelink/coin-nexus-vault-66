import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
  currentPrice: number;
}

type TradeMode = 'quantity' | 'amount';

export function TradingModal({ isOpen, onClose, symbol, name, currentPrice }: TradingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(currentPrice.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [mode, setMode] = useState<TradeMode>('quantity');

  // Fetch wallet balance when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchWallet = async () => {
      console.log('[TradingModal] Fetching wallet balance for', user.id);
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      if (error) {
        console.error('Error fetching wallet:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch wallet balance',
          variant: 'destructive',
        });
        return;
      }
      setWalletBalance(Number(data?.balance || 0));
    };
    fetchWallet();
  }, [isOpen, user, toast]);

  // Keep price in sync with currentPrice when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setPrice(currentPrice.toString());
    }
  }, [isOpen, currentPrice]);

  const parsedPrice = parseFloat(price || '0');
  const parsedQty = parseFloat(quantity || '0');
  const parsedAmount = parseFloat(amount || '0');

  const computed = {
    // If user chose "amount", derive qty from amount/price; else use qty directly
    qty: mode === 'amount' ? (parsedPrice > 0 ? parsedAmount / parsedPrice : 0) : parsedQty,
    total: mode === 'amount' ? parsedAmount : parsedQty * parsedPrice,
  };

  const symbolPure = symbol.replace('USDT', '');

  const setMaxForBalance = () => {
    if (!parsedPrice || parsedPrice <= 0) return;
    const maxQty = walletBalance / parsedPrice;
    if (mode === 'amount') {
      setAmount(walletBalance.toFixed(2));
    } else {
      setQuantity(maxQty.toString());
    }
    toast({
      title: 'Max applied',
      description: mode === 'amount'
        ? `Set to max amount: ${walletBalance.toFixed(2)} USDT`
        : `Set to max quantity: ${maxQty.toFixed(6)} ${symbolPure}`,
    });
  };

  const recordTrade = async (tradeType: 'buy' | 'sell', qty: number, px: number, total: number) => {
    const { error } = await supabase.from('trades').insert({
      user_id: user!.id,
      symbol: symbolPure,
      coin_name: name,
      trade_type: tradeType,
      quantity: qty,
      price: px,
      total_amount: total,
      status: 'completed',
    });
    if (error) throw error;
  };

  const updateWallet = async (newBalance: number) => {
    const { error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user!.id);
    if (error) throw error;
    setWalletBalance(newBalance);
  };

  const handleBuy = async () => {
    if (!user || !price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const qty = Number(computed.qty);
    const totalCost = Number(computed.total);

    if (qty <= 0 || totalCost <= 0) {
      toast({ title: 'Invalid input', description: 'Enter a valid quantity or amount', variant: 'destructive' });
      return;
    }

    if (walletBalance < totalCost) {
      toast({
        title: 'Insufficient balance',
        description: `You need ${totalCost.toFixed(2)} USDT but only have ${walletBalance.toFixed(2)} USDT.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const buyPrice = parseFloat(price);

      // Check if user already has this crypto in portfolio
      const { data: existingPosition } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbolPure)
        .single();

      if (existingPosition) {
        const oldQty = Number(existingPosition.amount);
        const newQty = oldQty + qty;
        const newTotalInvestment = Number(existingPosition.total_investment || (oldQty * Number(existingPosition.buy_price))) + totalCost;
        const newAvgPrice = newQty > 0 ? newTotalInvestment / newQty : buyPrice;

        const { error } = await supabase
          .from('portfolio_positions')
          .update({
            amount: newQty,
            buy_price: newAvgPrice,
            current_price: buyPrice,
            total_investment: newTotalInvestment,
            current_value: newQty * buyPrice,
            pnl: (newQty * buyPrice) - newTotalInvestment,
            pnl_percentage: newTotalInvestment > 0 ? (((newQty * buyPrice) - newTotalInvestment) / newTotalInvestment) * 100 : 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPosition.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portfolio_positions')
          .insert({
            user_id: user.id,
            symbol: symbolPure,
            coin_name: name,
            amount: qty,
            buy_price: buyPrice,
            current_price: buyPrice,
            total_investment: totalCost,
            current_value: qty * buyPrice,
            pnl: 0,
            pnl_percentage: 0,
            open_price: buyPrice,
            quantity: qty,
            trade_type: 'buy',
            status: 'open',
            position_type: 'long',
          });
        if (error) throw error;
      }

      // Deduct wallet and record trade
      await updateWallet(walletBalance - totalCost);
      await recordTrade('buy', qty, buyPrice, totalCost);

      toast({
        title: "Success",
        description: `Bought ${qty.toFixed(6)} ${symbolPure} for ${totalCost.toFixed(2)} USDT`,
      });

      onClose();
      setQuantity('');
      setAmount('');
    } catch (error) {
      console.error('Error buying crypto:', error);
      toast({
        title: "Error",
        description: "Failed to execute buy order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!user || !price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const qty = Number(computed.qty);
    if (qty <= 0) {
      toast({ title: 'Invalid input', description: 'Enter a valid quantity or amount', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const sellPrice = parseFloat(price);

      // Check existing position
      const { data: existingPosition } = await supabase
        .from('portfolio_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbolPure)
        .single();

      if (!existingPosition) {
        toast({
          title: "Error",
          description: "You don't own this cryptocurrency",
          variant: "destructive"
        });
        return;
      }

      if (Number(existingPosition.amount) < qty) {
        toast({
          title: "Error",
          description: "Insufficient quantity to sell",
          variant: "destructive"
        });
        return;
      }

      const newAmount = Number(existingPosition.amount) - qty;
      const proceeds = qty * sellPrice;

      if (newAmount === 0) {
        // Delete position if amount becomes 0
        const { error } = await supabase
          .from('portfolio_positions')
          .delete()
          .eq('id', existingPosition.id);
        if (error) throw error;
      } else {
        // Update position values after partial sell
        const newTotalInvestment = Math.max(
          0,
          Number(existingPosition.total_investment || (Number(existingPosition.amount) * Number(existingPosition.buy_price))) -
            (qty * Number(existingPosition.buy_price))
        );
        const { error } = await supabase
          .from('portfolio_positions')
          .update({
            amount: newAmount,
            current_price: sellPrice,
            current_value: newAmount * sellPrice,
            total_investment: newTotalInvestment,
            pnl: (newAmount * sellPrice) - newTotalInvestment,
            pnl_percentage: newTotalInvestment > 0 ? (((newAmount * sellPrice) - newTotalInvestment) / newTotalInvestment) * 100 : 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPosition.id);

        if (error) throw error;
      }

      // Credit wallet and record trade
      await updateWallet(walletBalance + proceeds);
      await recordTrade('sell', qty, sellPrice, proceeds);

      toast({
        title: "Success",
        description: `Sold ${qty.toFixed(6)} ${symbolPure} for ${proceeds.toFixed(2)} USDT`,
      });

      onClose();
      setQuantity('');
      setAmount('');
    } catch (error) {
      console.error('Error selling crypto:', error);
      toast({
        title: "Error",
        description: "Failed to execute sell order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trade {symbol.replace('USDT', '')}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Available: {walletBalance.toFixed(2)} USDT</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => setMode('quantity')} disabled={mode === 'quantity'}>
              By Qty
            </Button>
            <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => setMode('amount')} disabled={mode === 'amount'}>
              By Amount
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={setMaxForBalance}>
              Max
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="text-green-600">Buy</TabsTrigger>
            <TabsTrigger value="sell" className="text-red-600">Sell</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buy-price">Price (USDT)</Label>
              <Input
                id="buy-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
              />
            </div>
            {mode === 'quantity' ? (
              <div className="space-y-2">
                <Label htmlFor="buy-quantity">Quantity</Label>
                <Input
                  id="buy-quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  step="0.000001"
                  placeholder="0.00"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="buy-amount">Amount (USDT)</Label>
                <Input
                  id="buy-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Total: {computed.total > 0 ? computed.total.toFixed(2) : '0.00'} USDT
              {computed.qty > 0 && <span className="ml-2">(~{computed.qty.toFixed(6)} {symbolPure})</span>}
            </div>
            <Button 
              onClick={handleBuy} 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy'}
            </Button>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sell-price">Price (USDT)</Label>
              <Input
                id="sell-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
              />
            </div>
            {mode === 'quantity' ? (
              <div className="space-y-2">
                <Label htmlFor="sell-quantity">Quantity</Label>
                <Input
                  id="sell-quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  step="0.000001"
                  placeholder="0.00"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="sell-amount">Amount (USDT)</Label>
                <Input
                  id="sell-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Total: {computed.total > 0 ? computed.total.toFixed(2) : '0.00'} USDT
              {computed.qty > 0 && <span className="ml-2">(~{computed.qty.toFixed(6)} {symbolPure})</span>}
            </div>
            <Button 
              onClick={handleSell} 
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sell'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
