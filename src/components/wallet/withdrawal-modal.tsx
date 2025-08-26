
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: string;
}

interface BankAccount {
  id: string;
  account_number: string;
  account_holder_name: string;
  bank_name: string;
  ifsc_code: string;
}

export function WithdrawalModal({ isOpen, onClose, method }: WithdrawalModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      fetchBankAccounts();
      fetchUserBalance();
    }
  }, [isOpen, user]);

  const fetchBankAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSubmitWithdrawal = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (withdrawalAmount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive"
      });
      return;
    }

    if (method === 'Bank Account' && !selectedBankAccount) {
      toast({
        title: "Bank Account Required",
        description: "Please select a bank account",
        variant: "destructive"
      });
      return;
    }

    if (method === 'UPI' && !upiId.trim()) {
      toast({
        title: "UPI ID Required",
        description: "Please enter your UPI ID",
        variant: "destructive"
      });
      return;
    }

    if (method === 'USDT' && !walletAddress.trim()) {
      toast({
        title: "Wallet Address Required",
        description: "Please enter your USDT wallet address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: withdrawalAmount,
          bank_account_id: method === 'Bank Account' ? selectedBankAccount : null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for review. You'll be notified once it's processed.",
      });

      onClose();
      setAmount('');
      setSelectedBankAccount('');
      setUpiId('');
      setWalletAddress('');
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
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
          <DialogTitle>Withdraw via {method}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              Available Balance: <span className="font-semibold">₹{userBalance.toFixed(2)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="500"
              max={userBalance}
            />
            <p className="text-sm text-muted-foreground">
              Minimum withdrawal: ₹500
            </p>
          </div>

          {method === 'Bank Account' && (
            <div className="space-y-2">
              <Label>Select Bank Account</Label>
              {bankAccounts.length > 0 ? (
                <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - ****{account.account_number.slice(-4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No bank accounts found
                  </p>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </div>
              )}
            </div>
          )}

          {method === 'UPI' && (
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@paytm"
              />
            </div>
          )}

          {method === 'USDT' && (
            <div className="space-y-2">
              <Label htmlFor="walletAddress">USDT Wallet Address (TRC20)</Label>
              <Input
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"
              />
              <p className="text-sm text-muted-foreground">
                Amount: ~{amount ? (parseFloat(amount) / 83.5).toFixed(6) : '0'} USDT
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmitWithdrawal}
            disabled={isLoading}
            className="w-full bg-gradient-primary"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Withdrawal Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
