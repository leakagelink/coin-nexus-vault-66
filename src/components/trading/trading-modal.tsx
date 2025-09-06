import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
  currentPrice: number;
}

type TradeMode = 'quantity' | 'amount';

const getMinimumTradeAmount = (symbol: string): number => {
  // XRP and DOGE: minimum $50
  if (['XRP', 'DOGE'].includes(symbol)) {
    return 50;
  }
  // BTC and ETH: minimum $350
  if (['BTC', 'ETH'].includes(symbol)) {
    return 350;
  }
  // All other coins: minimum $150
  return 150;
};

export function TradingModal({ isOpen, onClose, symbol, name, currentPrice }: TradingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(currentPrice.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [mode, setMode] = useState<TradeMode>('quantity');
  const [existingPosition, setExistingPosition] = useState<any>(null);

  // Fetch wallet balance and existing position when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const fetchData = async () => {
      try {
        console.log('[TradingModal] Fetching wallet and position data for', user.id);
        
        // Fetch wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        
        if (walletError) {
          console.error('Error fetching wallet:', walletError);
          // Create wallet if doesn't exist
          if (walletError.code === 'PGRST116') {
            const { data: newWallet, error: createError } = await supabase
              .from('wallets')
              .insert({ user_id: user.id, balance: 10000 })
              .select()
              .single();
            
            if (createError) {
              console.error('Error creating wallet:', createError);
              setWalletBalance(0);
            } else {
              setWalletBalance(Number(newWallet.balance));
            }
          } else {
            setWalletBalance(0);
          }
        } else {
          setWalletBalance(Number(walletData?.balance || 0));
        }

        // Fetch existing position
        const symbolPure = symbol.replace('USDT', '');
        const { data: positionData, error: positionError } = await supabase
          .from('portfolio_positions')
          .select('*')
          .eq('user_id', user.id)
          .eq('symbol', symbolPure)
          .single();
        
        if (positionError && positionError.code !== 'PGRST116') {
          console.error('Error fetching position:', positionError);
        } else {
          setExistingPosition(positionData);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch account data',
          variant: 'destructive',
        });
      }
    };
    
    fetchData();
  }, [isOpen, user, symbol, toast]);

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
        ? `Set to max amount: ₹${walletBalance.toFixed(2)}`
        : `Set to max quantity: ${maxQty.toFixed(6)} ${symbolPure}`,
    });
  };

  const setMaxForSell = () => {
    if (!existingPosition) return;
    
    const maxSellQty = Number(existingPosition.amount);
    if (mode === 'amount') {
      setAmount((maxSellQty * parsedPrice).toFixed(2));
    } else {
      setQuantity(maxSellQty.toString());
    }
    toast({
      title: 'Max applied',
      description: `Set to max sell quantity: ${maxSellQty.toFixed(6)} ${symbolPure}`,
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

    // Check minimum trade amounts based on coin type
    const minimumAmount = getMinimumTradeAmount(symbolPure);
    if (totalCost < minimumAmount) {
      toast({
        title: 'Minimum amount required',
        description: `Minimum trade amount for ${symbolPure} is $${minimumAmount}`,
        variant: 'destructive',
      });
      return;
    }

    if (walletBalance < totalCost) {
      toast({
        title: 'Insufficient balance',
        description: `You need ₹${totalCost.toFixed(2)} but only have ₹${walletBalance.toFixed(2)}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const buyPrice = parseFloat(price);

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
          });
        if (error) throw error;
      }

      await updateWallet(walletBalance - totalCost);
      await recordTrade('buy', qty, buyPrice, totalCost);

      toast({
        title: "Success",
        description: `Bought ${qty.toFixed(6)} ${symbolPure} for ₹${totalCost.toFixed(2)}`,
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

    setIsLoading(true);
    try {
      const sellPrice = parseFloat(price);
      const newAmount = Number(existingPosition.amount) - qty;
      const proceeds = qty * sellPrice;

      if (newAmount === 0) {
        const { error } = await supabase
          .from('portfolio_positions')
          .delete()
          .eq('id', existingPosition.id);
        if (error) throw error;
      } else {
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

      await updateWallet(walletBalance + proceeds);
      await recordTrade('sell', qty, sellPrice, proceeds);

      toast({
        title: "Success",
        description: `Sold ${qty.toFixed(6)} ${symbolPure} for ₹${proceeds.toFixed(2)}`,
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
          <DialogTitle className="flex items-center gap-2">
            Trade {symbol.replace('USDT', '')}
            <div className="flex items-center gap-1 text-sm">
              {currentPrice > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              <span className="font-mono">₹{(currentPrice * 84).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Available: ₹{walletBalance.toFixed(2)}</span>
          {existingPosition && (
            <span>Holdings: {Number(existingPosition.amount).toFixed(6)} {symbolPure}</span>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <Button size="sm" variant={mode === 'quantity' ? 'default' : 'outline'} className="h-7 px-3" onClick={() => setMode('quantity')}>
            By Qty
          </Button>
          <Button size="sm" variant={mode === 'amount' ? 'default' : 'outline'} className="h-7 px-3" onClick={() => setMode('amount')}>
            By Amount
          </Button>
        </div>
        
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="text-green-600">Buy</TabsTrigger>
            <TabsTrigger value="sell" className="text-red-600" disabled={!existingPosition}>
              Sell {!existingPosition && '(No Holdings)'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buy-price">Price (₹)</Label>
              <Input
                id="buy-price"
                type="number"
                value={(parseFloat(price) * 84).toFixed(2)}
                onChange={(e) => setPrice((parseFloat(e.target.value) / 84).toString())}
                step="0.01"
              />
            </div>
            {mode === 'quantity' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="buy-quantity">Quantity</Label>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={setMaxForBalance}>
                    Max
                  </Button>
                </div>
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="buy-amount">Amount (₹)</Label>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={setMaxForBalance}>
                    Max
                  </Button>
                </div>
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
              Total: ₹{(computed.total * 84).toFixed(2)}
              {computed.qty > 0 && <span className="ml-2">(~{computed.qty.toFixed(6)} {symbolPure})</span>}
            </div>
            <Button 
              onClick={handleBuy} 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading || computed.total <= 0}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy'}
            </Button>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sell-price">Price (₹)</Label>
              <Input
                id="sell-price"
                type="number"
                value={(parseFloat(price) * 84).toFixed(2)}
                onChange={(e) => setPrice((parseFloat(e.target.value) / 84).toString())}
                step="0.01"
              />
            </div>
            {mode === 'quantity' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="sell-quantity">Quantity</Label>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={setMaxForSell}>
                    Max
                  </Button>
                </div>
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="sell-amount">Amount (₹)</Label>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={setMaxForSell}>
                    Max
                  </Button>
                </div>
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
              Total: ₹{(computed.total * 84).toFixed(2)}
              {computed.qty > 0 && <span className="ml-2">(~{computed.qty.toFixed(6)} {symbolPure})</span>}
            </div>
            <Button 
              onClick={handleSell} 
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading || computed.total <= 0}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sell'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
