import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function FarmerRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmName: '',
    collectorId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword || !formData.farmName || !formData.collectorId) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Simulate registration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store registration data
      localStorage.setItem('farmerEmail', formData.email);
      localStorage.setItem('farmerName', formData.fullName);
      localStorage.setItem('farmName', formData.farmName);
      localStorage.setItem('collectorId', formData.collectorId);

      setSuccess(true);

      // Auto-login after registration
      login(formData.email, 'farmer');

      // Redirect to farmer portal after 2 seconds
      setTimeout(() => {
        navigate('/farmer-portal');
      }, 2000);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <Card className="p-8 border-2 border-primary bg-white shadow-lg text-center">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-heading font-bold text-primary mb-2">
                  Registration Successful!
                </h2>
                <p className="font-paragraph text-secondary">
                  Welcome, {formData.fullName}! Redirecting to your dashboard...
                </p>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="p-8 border-2 border-primary bg-white shadow-lg">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-heading font-bold text-primary mb-2">
                Farmer Registration
              </h1>
              <p className="text-base font-paragraph text-secondary">
                Create your account
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  name="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-secondary/20 rounded-lg focus:border-primary focus:outline-none transition"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-secondary/20 rounded-lg focus:border-primary focus:outline-none transition"
                  disabled={isLoading}
                />
              </div>

              {/* Farm Name */}
              <div>
                <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                  Farm/Collection Name
                </label>
                <Input
                  type="text"
                  name="farmName"
                  placeholder="Your farm name"
                  value={formData.farmName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-secondary/20 rounded-lg focus:border-primary focus:outline-none transition"
                  disabled={isLoading}
                />
              </div>

              {/* Collector ID */}
              <div>
                <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                  Collector ID
                </label>
                <Input
                  type="text"
                  name="collectorId"
                  placeholder="Your unique collector ID"
                  value={formData.collectorId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-secondary/20 rounded-lg focus:border-primary focus:outline-none transition"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
                  Minimum 8 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-paragraph font-semibold text-secondary mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-secondary/20 rounded-lg focus:border-primary focus:outline-none transition pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-heading font-bold py-3 rounded-lg transition disabled:opacity-50 mt-6"
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 pt-6 border-t border-secondary/10 text-center">
              <p className="text-sm font-paragraph text-secondary">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/farmer-login')}
                  className="text-primary hover:underline font-semibold"
                >
                  Login here
                </button>
              </p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
