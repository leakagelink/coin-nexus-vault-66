
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, CheckCircle } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: string;
}

export function DepositModal({ isOpen, onClose, method }: DepositModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [step, setStep] = useState<'amount' | 'payment' | 'confirm'>('amount');

  const getPaymentDetails = (method: string, amount: string) => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return null;

    switch (method) {
      case 'UPI':
        return {
          method: 'UPI',
          upiId: 'crypto@paytm',
          amount: amt,
          qrCode: `upi://pay?pa=crypto@paytm&pn=CryptoExchange&am=${amt}&cu=INR`,
          instructions: [
            'Open your UPI app (PhonePe, Google Pay, Paytm, etc.)',
            'Scan the QR code or pay to UPI ID: crypto@paytm',
            `Send exactly ₹${amt.toFixed(2)}`,
            'Copy the transaction ID from your app',
            'Submit the transaction ID below'
          ]
        };
      case 'Bank Account':
        return {
          method: 'Bank Transfer',
          bankDetails: {
            accountName: 'Crypto Exchange India Pvt Ltd',
            accountNumber: '1234567890123456',
            ifscCode: 'HDFC0001234',
            bankName: 'HDFC Bank'
          },
          amount: amt,
          instructions: [
            'Login to your net banking or visit branch',
            'Transfer money to the account details shown',
            `Send exactly ₹${amt.toFixed(2)}`,
            'Use your registered mobile number as reference',
            'Copy the transaction reference number',
            'Submit the transaction ID below'
          ]
        };
      case 'USDT':
        return {
          method: 'USDT (TRC20)',
          walletAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
          amount: (amt / 83.5).toFixed(6), // Approximate USDT conversion
          instructions: [
            'Send USDT (TRC20) to the wallet address shown',
            `Send exactly ${(amt / 83.5).toFixed(6)} USDT`,
            'Network: TRON (TRC20)',
            'Copy the transaction hash (TXID)',
            'Submit the transaction hash below'
          ]
        };
      default:
        return null;
    }
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    const details = getPaymentDetails(method, amount);
    if (details) {
      setPaymentDetails(details);
      setStep('payment');
    }
  };

  const handleSubmitTransaction = async () => {
    if (!user || !transactionId.trim()) {
      toast({
        title: "Error",
        description: "Please enter transaction ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          payment_method: method,
          transaction_reference: transactionId.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit request has been submitted for review. You'll be notified once it's processed.",
      });

      setStep('confirm');
      setTimeout(() => {
        onClose();
        setStep('amount');
        setAmount('');
        setTransactionId('');
        setPaymentDetails(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast({
        title: "Error",
        description: "Failed to submit deposit request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit via {method}</DialogTitle>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="100"
              />
              <p className="text-sm text-muted-foreground">
                Minimum deposit: ₹100
              </p>
            </div>
            
            <Button onClick={handleProceed} className="w-full bg-gradient-primary">
              Proceed to Payment
            </Button>
          </div>
        )}

        {step === 'payment' && paymentDetails && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">Payment Details</h3>
              
              {method === 'UPI' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>UPI ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{paymentDetails.upiId}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(paymentDetails.upiId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">₹{paymentDetails.amount}</span>
                  </div>
                </div>
              )}

              {method === 'Bank Account' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Account Name:</span>
                    <span className="font-mono text-sm">{paymentDetails.bankDetails.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{paymentDetails.bankDetails.accountNumber}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(paymentDetails.bankDetails.accountNumber)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>IFSC Code:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{paymentDetails.bankDetails.ifscCode}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(paymentDetails.bankDetails.ifscCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">₹{paymentDetails.amount}</span>
                  </div>
                </div>
              )}

              {method === 'USDT' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Wallet Address:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{paymentDetails.walletAddress}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(paymentDetails.walletAddress)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">{paymentDetails.amount} USDT</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Instructions:</h4>
              <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {paymentDetails.instructions.map((instruction: string, index: number) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txnId">Transaction ID / Reference Number</Label>
              <Input
                id="txnId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('amount')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmitTransaction}
                disabled={isLoading || !transactionId.trim()}
                className="flex-1 bg-gradient-success"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Request Submitted!</h3>
            <p className="text-muted-foreground">
              Your deposit request has been submitted successfully. 
              It will be processed within 24 hours.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
