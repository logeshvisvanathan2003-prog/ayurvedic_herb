import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eye, EyeOff, AlertCircle, Lock, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'twoFactor'>('credentials');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      // Simulate credentials verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Move to two-factor authentication
      setStep('twoFactor');
      setIsLoading(false);
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!twoFactorCode || twoFactorCode.length !== 6) {
        setError('Please enter a valid 6-digit code');
        setIsLoading(false);
        return;
      }

      // Simulate 2FA verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store admin session
      localStorage.setItem('adminEmail', email);
      localStorage.setItem('adminSession', 'true');

      // Login user
      login(email, 'admin');

      // Redirect to home
      navigate('/');
    } catch (err) {
      setError('Two-factor authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="p-8 border-2 border-primary bg-white shadow-lg">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-heading font-bold text-primary mb-2">
                Admin Portal
              </h1>
              <p className="text-base font-paragraph text-secondary">
                Secure Administration Access
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 bg-destructive/10 border-destructive text-destructive flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </Alert>
            )}

            {/* Step 1: Credentials */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                    Admin Email
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-secondary/20 rounded-lg focus:border-primary focus:outline-none transition"
                    disabled={isLoading}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-secondary/20 rounded-lg focus:border-primary focus:outline-none transition pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-paragraph text-secondary/60 mt-1">
                    Minimum 8 characters required
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-heading font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Next'}
                </Button>
              </form>
            )}

            {/* Step 2: Two-Factor Authentication */}
            {step === 'twoFactor' && (
              <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
                <div className="bg-highlightyellow/10 border border-highlightyellow rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-highlightyellow mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-paragraph font-semibold text-secondary mb-1">
                        Two-Factor Authentication
                      </p>
                      <p className="text-xs font-paragraph text-secondary/70">
                        Enter the 6-digit code from your authenticator app
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2FA Code Field */}
                <div>
                  <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                    Authentication Code
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="w-full px-4 py-3 border-2 border-secondary/20 rounded-lg focus:border-primary focus:outline-none transition text-center text-2xl tracking-widest font-mono"
                    disabled={isLoading}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || twoFactorCode.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-heading font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Button>

                {/* Back Button */}
                <Button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setTwoFactorCode('');
                    setError('');
                  }}
                  disabled={isLoading}
                  className="w-full bg-secondary/10 hover:bg-secondary/20 text-secondary font-heading font-bold py-3 rounded-lg transition"
                >
                  Back
                </Button>
              </form>
            )}

            {/* Footer Links */}
            {step === 'credentials' && (
              <div className="mt-6 pt-6 border-t border-secondary/10 text-center space-y-2">
                <p className="text-sm font-paragraph text-secondary">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/admin-register')}
                    className="text-primary hover:underline font-semibold"
                  >
                    Register here
                  </button>
                </p>
                <p className="text-xs font-paragraph text-secondary/60">
                  Need help?{' '}
                  <button
                    onClick={() => navigate('/contact')}
                    className="text-primary hover:underline"
                  >
                    Contact Support
                  </button>
                </p>
              </div>
            )}
          </Card>

          {/* Security Features */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-secondary/10 rounded-lg text-center">
              <Shield className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs font-paragraph text-secondary font-semibold">Encrypted</p>
            </div>
            <div className="p-3 bg-white border border-secondary/10 rounded-lg text-center">
              <Lock className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs font-paragraph text-secondary font-semibold">2FA</p>
            </div>
            <div className="p-3 bg-white border border-secondary/10 rounded-lg text-center">
              <AlertCircle className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs font-paragraph text-secondary font-semibold">Monitored</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
