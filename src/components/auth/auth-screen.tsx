
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

type AuthStep = 'login' | 'signup' | 'verify';

export function AuthScreen() {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, verifyEmailOtp } = useAuth();

  const resetFields = () => {
    setEmail('');
    setMobile('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setOtp('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (step === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Successfully logged in!",
          });
        }
      } else if (step === 'signup') {
        if (password !== confirmPassword) {
          toast({
            title: "Password mismatch",
            description: "Password and confirm password do not match.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(email, password, fullName, mobile);
        if (error) {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "OTP Sent",
            description: "We sent an OTP to your email. Please enter it to verify your account.",
          });
          setStep('verify');
        }
      } else if (step === 'verify') {
        if (!otp || otp.length < 4) {
          toast({
            title: "Invalid OTP",
            description: "Please enter the OTP sent to your email.",
            variant: "destructive",
          });
          return;
        }
        const { error } = await verifyEmailOtp(email, otp);
        if (!error) {
          // onAuthStateChange will log the user in and we redirect there
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (step === 'verify') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="otp">Enter OTP sent to {email}</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="6-digit OTP"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => {
                setStep('signup');
                setOtp('');
              }}
            >
              Change Email
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
          </div>
        </form>
      );
    }

    const isLogin = step === 'login';

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                placeholder="Enter your mobile number"
              />
            </div>
          </>
        )}
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {!isLogin && (
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your password"
            />
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full bg-gradient-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLogin ? 'Logging in...' : 'Creating Account...'}
            </>
          ) : (
            isLogin ? 'Login' : 'Sign Up'
          )}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">
            {step === 'login' ? 'Welcome Back' : step === 'signup' ? 'Create Account' : 'Verify Email'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderForm()}
          
          <div className="mt-4 text-center">
            {step !== 'verify' ? (
              <Button
                variant="link"
                onClick={() => {
                  const next = step === 'login' ? 'signup' : 'login';
                  setStep(next);
                  resetFields();
                }}
                className="text-sm"
              >
                {step === 'login' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Login"}
              </Button>
            ) : (
              <Button
                variant="link"
                onClick={() => {
                  setStep('signup');
                }}
                className="text-sm"
              >
                Go back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
