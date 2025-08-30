
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BinanceChart } from '@/components/charts/BinanceChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Chart() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [cryptoName, setCryptoName] = useState('');
  const [isValidSymbol, setIsValidSymbol] = useState(true);
  const isMobile = useIsMobile();

  const cryptoMapping: { [key: string]: string } = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum', 
    'BNBUSDT': 'BNB',
    'ADAUSDT': 'Cardano',
    'SOLUSDT': 'Solana',
    'USDTUSDT': 'Tether',
    'XRPUSDT': 'Ripple',
    'DOTUSDT': 'Polkadot',
    'LINKUSDT': 'Chainlink',
    'LTCUSDT': 'Litecoin'
  };

  useEffect(() => {
    if (symbol) {
      // Validate symbol format
      if (!symbol.match(/^[A-Z]+USDT$/)) {
        setIsValidSymbol(false);
        return;
      }
      
      setCryptoName(cryptoMapping[symbol] || symbol.replace('USDT', ''));
      setIsValidSymbol(true);
    }
  }, [symbol]);

  const handleBack = () => {
    // Enhanced back navigation for mobile
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (!symbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-2">
        <div className="text-center text-white max-w-xs">
          <AlertCircle className="mx-auto mb-3 text-red-400 h-8 w-8" />
          <h1 className="text-lg font-bold mb-2">Symbol Not Found</h1>
          <p className="text-gray-400 mb-3 text-sm">The requested trading symbol was not provided.</p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-2" 
            size="sm"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!isValidSymbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-2">
        <div className="text-center text-white max-w-xs">
          <AlertCircle className="mx-auto mb-3 text-yellow-400 h-8 w-8" />
          <h1 className="text-lg font-bold mb-2">Invalid Symbol</h1>
          <p className="text-gray-400 mb-2 text-sm">The symbol "{symbol}" is not a valid trading pair.</p>
          <p className="text-gray-500 mb-3 text-xs">Please use format like BTCUSDT, ETHUSDT, etc.</p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleBack} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3 w-3" />
              Go Back
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              className="bg-blue-600 hover:bg-blue-700 text-xs" 
              size="sm"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Mobile-Optimized Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-2 py-2">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-white hover:bg-gray-800 flex items-center gap-1 text-xs px-2 py-1 h-8"
              size="sm"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </Button>
            
            <div className="text-center flex-1 mx-2">
              <h1 className="text-sm font-bold text-white truncate">{cryptoName}</h1>
              <p className="text-xs text-gray-400">Live Chart</p>
            </div>
            
            <div className="w-12"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>
      
      {/* Mobile-Optimized Chart Container */}
      <div className="px-1 py-1">
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
