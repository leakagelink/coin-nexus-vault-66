
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CryptoChart } from './crypto-chart';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
}

export function ChartModal({ isOpen, onClose, symbol, name }: ChartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Price Chart</DialogTitle>
        </DialogHeader>
        <CryptoChart
          symbol={symbol}
          name={name}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
