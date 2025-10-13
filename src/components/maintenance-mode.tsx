import { Shield, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full glass border-primary/20">
        <CardContent className="p-8 md:p-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Nadex
            </h1>
            <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-semibold text-foreground">
              <AlertCircle className="w-6 h-6 text-primary" />
              <span>Under Maintenance</span>
            </div>
          </div>
          
          <div className="space-y-4 text-muted-foreground max-w-xl mx-auto">
            <p className="text-lg md:text-xl font-medium text-foreground">
              Please Clear Your Due Payments
            </p>
            <p className="text-base md:text-lg">
              Our platform is currently unavailable as there are outstanding payments that need to be settled. 
              To restore full access to the website and continue trading, please clear all due payments at your earliest convenience.
            </p>
            <p className="text-sm md:text-base">
              We appreciate your prompt attention to this matter. Once the payments are processed, 
              the platform will be immediately restored to full functionality.
            </p>
          </div>
          
          <div className="pt-6 space-y-2">
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary/50 h-2 rounded-full w-1/4"></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting Payment Confirmation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
