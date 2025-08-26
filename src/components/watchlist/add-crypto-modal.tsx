
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus } from 'lucide-react';

interface AddCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCryptoAdded: () => void;
}

const popularCryptos = [
  { symbol: 'BTC', name: 'Bitcoin', coin_id: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', coin_id: 'ethereum' },
  { symbol: 'BNB', name: 'BNB', coin_id: 'binancecoin' },
  { symbol: 'ADA', name: 'Cardano', coin_id: 'cardano' },
  { symbol: 'SOL', name: 'Solana', coin_id: 'solana' },
  { symbol: 'USDT', name: 'Tether', coin_id: 'tether' },
  { symbol: 'XRP', name: 'XRP', coin_id: 'ripple' },
  { symbol: 'DOT', name: 'Polkadot', coin_id: 'polkadot' },
];

export function AddCryptoModal({ isOpen, onClose, onCryptoAdded }: AddCryptoModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredCryptos = popularCryptos.filter(crypto =>
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCrypto = async (crypto: typeof popularCryptos[0]) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          symbol: crypto.symbol,
          coin_name: crypto.name,
          coin_id: crypto.coin_id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already in watchlist",
            description: `${crypto.symbol} is already in your watchlist`,
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Added to watchlist",
          description: `${crypto.symbol} has been added to your watchlist`,
        });
        onCryptoAdded();
        onClose();
      }
    } catch (error) {
      console.error('Error adding crypto:', error);
      toast({
        title: "Error",
        description: "Failed to add cryptocurrency to watchlist",
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
          <DialogTitle>Add Cryptocurrency</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Cryptocurrency</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search BTC, ETH, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredCryptos.map((crypto) => (
              <div
                key={crypto.symbol}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-xs">
                      {crypto.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{crypto.symbol}</p>
                    <p className="text-sm text-muted-foreground">{crypto.name}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddCrypto(crypto)}
                  disabled={isLoading}
                  className="bg-gradient-primary"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {filteredCryptos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cryptocurrencies found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
