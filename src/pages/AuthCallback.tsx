import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h1 className="text-lg font-semibold">Logging you in…</h1>
        <p className="text-sm text-muted-foreground">Processing secure link. This may take a moment.</p>
      </div>
    </main>
  );
}
