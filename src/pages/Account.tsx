
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { User, DollarSign, FileText, Phone, Lock, ChevronRight } from "lucide-react";
import { ProfileSection } from "@/components/account/profile-section";
import { BankAccountsSection } from "@/components/account/bank-accounts-section";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Account = () => {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('');

  const { data: orders } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleFundDeposit = () => {
    // Navigate to wallet page for deposits
    window.location.href = '/wallet';
  };

  const handleAllOrders = () => {
    setActiveSection('orders');
  };

  const handleContactUs = () => {
    // Open contact form or redirect to contact page
    alert('Contact support: support@nadex.com');
  };

  const handlePasswordChange = () => {
    // Redirect to password change
    alert('Password change functionality will be implemented');
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold gradient-text">My Account</h1>
        </div>

        {activeSection === '' && (
          <>
            <ProfileSection />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-16 justify-between glass hover-glow"
                onClick={() => setActiveSection('profile')}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <span>Profile</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="h-16 justify-between glass hover-glow"
                onClick={() => setActiveSection('banks')}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Add Bank</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="h-16 justify-between glass hover-glow"
                onClick={handleFundDeposit}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>Fund Deposit</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="h-16 justify-between glass hover-glow"
                onClick={handleAllOrders}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>All Orders ({orders?.length || 0})</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="h-16 justify-between glass hover-glow"
                onClick={handleContactUs}
              >
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>Contact Us</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="h-16 justify-between glass hover-glow"
                onClick={handlePasswordChange}
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <span>Password Change</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="pt-4">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={signOut}
              >
                Logout
              </Button>
            </div>
          </>
        )}

        {activeSection === 'profile' && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection('')}
              className="mb-4"
            >
              ← Back
            </Button>
            <ProfileSection />
          </div>
        )}

        {activeSection === 'banks' && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection('')}
              className="mb-4"
            >
              ← Back
            </Button>
            <BankAccountsSection />
          </div>
        )}

        {activeSection === 'orders' && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection('')}
              className="mb-4"
            >
              ← Back
            </Button>
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">All Orders</h3>
              {orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{order.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.trade_type.toUpperCase()} • {order.quantity} @ ${order.price}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total_amount}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No orders found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Account;
