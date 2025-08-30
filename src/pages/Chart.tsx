
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BinanceChart } from '@/components/charts/BinanceChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function Chart() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [cryptoName, setCryptoName] = useState('');
  const [isValidSymbol, setIsValidSymbol] = useState(true);

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
    navigate(-1);
  };

  if (!symbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-3xl font-bold mb-4">Symbol Not Found</h1>
          <p className="text-gray-400 mb-6">The requested trading symbol was not provided.</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!isValidSymbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
          <h1 className="text-3xl font-bold mb-4">Invalid Symbol</h1>
          <p className="text-gray-400 mb-2">The symbol "{symbol}" is not a valid trading pair.</p>
          <p className="text-gray-500 mb-6">Please use format like BTCUSDT, ETHUSDT, etc.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-white hover:bg-gray-800 flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">Professional Trading Chart</h1>
              <p className="text-sm text-gray-400">Powered by Binance API</p>
            </div>
            
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>
      
      {/* Chart Container */}
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
