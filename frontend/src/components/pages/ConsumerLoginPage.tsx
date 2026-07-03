import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function ConsumerLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Simulate login - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('consumerEmail', email);
      } else {
        localStorage.removeItem('consumerEmail');
      }

      // Login user
      login(email, 'consumer');

      // Redirect to consumer portal
      navigate('/consumer-portal');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
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
              <h1 className="text-4xl font-heading font-bold text-primary mb-2">
                Consumer Portal
              </h1>
              <p className="text-base font-paragraph text-secondary">
                Track Your Products
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 bg-destructive/10 border-destructive text-destructive flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-secondary/20 cursor-pointer"
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm font-paragraph text-secondary cursor-pointer">
                  Remember me
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-heading font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 pt-6 border-t border-secondary/10 text-center space-y-2">
              <p className="text-sm font-paragraph text-secondary">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/consumer-register')}
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
                  Get Support
                </button>
              </p>
            </div>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-highlightyellow/10 border border-highlightyellow rounded-lg">
            <p className="text-xs font-paragraph text-secondary text-center">
              🔒 Your personal information is secure and encrypted. We never share your data.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
