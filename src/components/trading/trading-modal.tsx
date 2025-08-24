
import { useState } from 'react';
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

export function TradingModal({ isOpen, onClose, symbol, name, currentPrice }: TradingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(currentPrice.toString());
  const [isLoading, setIsLoading] = useState(false);

  const handleBuy = async () => {
    if (!user || !quantity || !price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const qty = parseFloat(quantity);
      const buyPrice = parseFloat(price);
      const totalCost = qty * buyPrice;

      // Check if user already has this crypto in portfolio
      const { data: existingPosition } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol.replace('USDT', ''))
        .single();

      if (existingPosition) {
        // Update existing position
        const newQuantity = existingPosition.quantity + qty;
        const newAvgPrice = ((existingPosition.quantity * existingPosition.avg_price) + totalCost) / newQuantity;
        
        const { error } = await supabase
          .from('portfolio')
          .update({
            quantity: newQuantity,
            avg_price: newAvgPrice,
            current_price: buyPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPosition.id);

        if (error) throw error;
      } else {
        // Create new position
        const { error } = await supabase
          .from('portfolio')
          .insert({
            user_id: user.id,
            symbol: symbol.replace('USDT', ''),
            name: name,
            quantity: qty,
            avg_price: buyPrice,
            current_price: buyPrice
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Successfully bought ${quantity} ${symbol.replace('USDT', '')}`,
      });

      onClose();
      setQuantity('');
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
    if (!user || !quantity || !price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const qty = parseFloat(quantity);
      const sellPrice = parseFloat(price);
      
      // Check existing position
      const { data: existingPosition } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol.replace('USDT', ''))
        .single();

      if (!existingPosition) {
        toast({
          title: "Error",
          description: "You don't own this cryptocurrency",
          variant: "destructive"
        });
        return;
      }

      if (existingPosition.quantity < qty) {
        toast({
          title: "Error",
          description: "Insufficient quantity to sell",
          variant: "destructive"
        });
        return;
      }

      const newQuantity = existingPosition.quantity - qty;
      
      if (newQuantity === 0) {
        // Delete position if quantity becomes 0
        const { error } = await supabase
          .from('portfolio')
          .delete()
          .eq('id', existingPosition.id);

        if (error) throw error;
      } else {
        // Update position
        const { error } = await supabase
          .from('portfolio')
          .update({
            quantity: newQuantity,
            current_price: sellPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPosition.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Successfully sold ${quantity} ${symbol.replace('USDT', '')}`,
      });

      onClose();
      setQuantity('');
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
            <div className="space-y-2">
              <Label htmlFor="buy-quantity">Quantity</Label>
              <Input
                id="buy-quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.00001"
                placeholder="0.00"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '0.00'} USDT
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
            <div className="space-y-2">
              <Label htmlFor="sell-quantity">Quantity</Label>
              <Input
                id="sell-quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.00001"
                placeholder="0.00"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '0.00'} USDT
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
