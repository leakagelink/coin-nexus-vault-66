
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, CreditCard, DollarSign, FileText, Phone, Lock, ChevronRight } from "lucide-react";

const Account = () => {
  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold gradient-text">My Account</h1>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">John Doe</h3>
                <p className="text-muted-foreground">john.doe@example.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="h-16 justify-between glass hover-glow">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <span>Profile</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="h-16 justify-between glass hover-glow">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Add Bank</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="h-16 justify-between glass hover-glow">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Fund Deposit</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="h-16 justify-between glass hover-glow">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span>All Orders</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="h-16 justify-between glass hover-glow">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <span>Contact Us</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="h-16 justify-between glass hover-glow">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <span>Password Change</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Account;
