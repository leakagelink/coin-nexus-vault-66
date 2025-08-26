
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AddFundsDialogProps {
  userId: string;
  userLabel?: string;
  onSuccess?: () => void;
}

export function AddFundsDialog({ userId, userLabel, onSuccess }: AddFundsDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("Admin credit");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to continue.",
        variant: "destructive",
      });
      return;
    }
    
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive amount.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    console.log("Admin adding funds", { target_user_id: userId, amount: value, admin_id: user.id });
    
    try {
      // First, ensure the wallet exists for the user
      const { data: existingWallet, error: walletCheckError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', userId)
        .single();

      if (walletCheckError && walletCheckError.code !== 'PGRST116') {
        console.error("Wallet check error:", walletCheckError);
        throw walletCheckError;
      }

      // If wallet doesn't exist, create one first
      if (!existingWallet) {
        const { error: createWalletError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance: 0,
            currency: 'INR'
          });

        if (createWalletError) {
          console.error("Create wallet error:", createWalletError);
          throw createWalletError;
        }
      }

      // Now update the wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: (existingWallet?.balance || 0) + value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error("Update wallet error:", updateError);
        throw updateError;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          transaction_type: 'deposit',
          amount: value,
          total_value: value,
          status: 'completed'
        });

      if (transactionError) {
        console.error("Transaction record error:", transactionError);
        throw transactionError;
      }
      
      console.log("Add funds success");
      toast({
        title: "Funds added successfully",
        description: `₹${value.toLocaleString("en-IN")} added to ${userLabel || "user"}.`,
      });
      
      setOpen(false);
      setAmount("");
      setNotes("Admin credit");
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error("Exception in add funds:", error);
      toast({
        title: "Add funds failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-success">
          <Wallet className="h-4 w-4 mr-1" />
          Add Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds {userLabel ? `to ${userLabel}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (INR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Admin credit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-success">
            {submitting ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
