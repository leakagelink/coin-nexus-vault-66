
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BinanceChart } from '@/components/charts/BinanceChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Chart() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [cryptoName, setCryptoName] = useState('');

  const cryptoMapping: { [key: string]: string } = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum', 
    'BNBUSDT': 'BNB',
    'ADAUSDT': 'Cardano',
    'SOLUSDT': 'Solana',
    'USDTUSDT': 'Tether'
  };

  useEffect(() => {
    if (symbol) {
      setCryptoName(cryptoMapping[symbol] || symbol.replace('USDT', ''));
    }
  }, [symbol]);

  const handleBack = () => {
    navigate(-1);
  };

  if (!symbol) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chart not found</h1>
          <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <BinanceChart
          symbol={symbol}
          name={cryptoName}
          onClose={handleBack}
          isFullPage={true}
        />
      </div>
    </div>
  );
}
