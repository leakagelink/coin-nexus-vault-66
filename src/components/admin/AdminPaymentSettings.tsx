
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { ShieldCheck } from "lucide-react";

function ensureArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val).split("\n").map((s) => s.trim()).filter(Boolean);
}

export function AdminPaymentSettings() {
  const { toast } = useToast();
  const { settings, isLoading, refetch } = useAdminSettings();

  const [upiId, setUpiId] = useState("");
  const [upiQrCode, setUpiQrCode] = useState("");
  const [upiInstructions, setUpiInstructions] = useState("");

  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankInstructions, setBankInstructions] = useState("");

  const [usdtAddress, setUsdtAddress] = useState("");
  const [usdtNetwork, setUsdtNetwork] = useState("TRC20");
  const [usdtInstructions, setUsdtInstructions] = useState("");

  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;

    // UPI
    const upi = settings.upi_details || {};
    setUpiId(upi.upi_id || "");
    setUpiQrCode(upi.qr_code || "");
    setUpiInstructions(Array.isArray(upi.instructions) ? upi.instructions.join("\n") : (upi.instructions || ""));

    // Bank
    const bank = settings.bank_details || {};
    setBankAccountNumber(bank.account_number || "");
    setBankIfsc(bank.ifsc || "");
    setBankHolder(bank.account_holder || "");
    setBankName(bank.bank_name || "");
    setBankInstructions(Array.isArray(bank.instructions) ? bank.instructions.join("\n") : (bank.instructions || ""));

    // USDT
    const usdt = settings.usdt_details || {};
    setUsdtAddress(usdt.wallet_address || "");
    setUsdtNetwork(usdt.network || "TRC20");
    setUsdtInstructions(Array.isArray(usdt.instructions) ? usdt.instructions.join("\n") : (usdt.instructions || ""));
  }, [settings]);

  const saveOne = async (key: "upi_details" | "bank_details" | "usdt_details", value: any) => {
    setSaving(key);
    const { error } = await supabase
      .from("admin_settings")
      .upsert([{ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }], {
        onConflict: "setting_key",
      });
    setSaving(null);
    if (error) {
      console.error("Save admin setting error:", error);
      toast({
        title: "Failed to save",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Saved", description: "Settings updated successfully." });
      refetch();
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Payment Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">Loading settings...</div>
        ) : (
          <>
            {/* UPI Settings */}
            <div className="space-y-3">
              <h3 className="font-semibold">UPI</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">UPI ID</label>
                  <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="company@upi" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">QR Code URL (optional)</label>
                  <Input value={upiQrCode} onChange={(e) => setUpiQrCode(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Instructions (one per line)</label>
                <Textarea value={upiInstructions} onChange={(e) => setUpiInstructions(e.target.value)} rows={4} />
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-gradient-success"
                  disabled={saving !== null}
                  onClick={() =>
                    saveOne("upi_details", {
                      upi_id: upiId,
                      qr_code: upiQrCode,
                      instructions: ensureArray(upiInstructions),
                    })
                  }
                >
                  {saving === "upi_details" ? "Saving..." : "Save UPI"}
                </Button>
              </div>
            </div>

            {/* Bank Settings */}
            <div className="space-y-3">
              <h3 className="font-semibold">Bank Account</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Account Holder</label>
                  <Input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="Company Name" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Bank Name</label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="HDFC Bank" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Account Number</label>
                  <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="1234567890" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">IFSC Code</label>
                  <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="HDFC0001234" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Instructions (one per line)</label>
                <Textarea value={bankInstructions} onChange={(e) => setBankInstructions(e.target.value)} rows={4} />
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-gradient-success"
                  disabled={saving !== null}
                  onClick={() =>
                    saveOne("bank_details", {
                      account_holder: bankHolder,
                      bank_name: bankName,
                      account_number: bankAccountNumber,
                      ifsc: bankIfsc,
                      instructions: ensureArray(bankInstructions),
                    })
                  }
                >
                  {saving === "bank_details" ? "Saving..." : "Save Bank"}
                </Button>
              </div>
            </div>

            {/* USDT Settings */}
            <div className="space-y-3">
              <h3 className="font-semibold">USDT</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Wallet Address</label>
                  <Input value={usdtAddress} onChange={(e) => setUsdtAddress(e.target.value)} placeholder="TRON address" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Network</label>
                  <Input value={usdtNetwork} onChange={(e) => setUsdtNetwork(e.target.value)} placeholder="TRC20" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Instructions (one per line)</label>
                <Textarea value={usdtInstructions} onChange={(e) => setUsdtInstructions(e.target.value)} rows={4} />
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-gradient-success"
                  disabled={saving !== null}
                  onClick={() =>
                    saveOne("usdt_details", {
                      wallet_address: usdtAddress,
                      network: usdtNetwork,
                      instructions: ensureArray(usdtInstructions),
                    })
                  }
                >
                  {saving === "usdt_details" ? "Saving..." : "Save USDT"}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
