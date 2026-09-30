import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Gem, Lock, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (user) {
      if (user.role === 'OWNER') {
        navigate('/owner/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(username.trim(), password.trim());
      // AuthProvider will update user state and trigger useEffect navigation
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex flex-col justify-between selection:bg-[#B8893B]/20 selection:text-[#9B1C31]">
      {/* Top Brand Banner */}
      <header className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#9B1C31] flex items-center justify-center shadow-soft text-amber-300">
            <Gem className="h-5 w-5 text-[#FAF6EF]" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-tight text-[#9B1C31]">
              Kumkum Payal
            </h1>
            <p className="text-xs text-[#8C857E]">Jewellery Accounting & Job Work</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#B8893B] bg-[#FAF6EF] px-3 py-1.5 rounded-full border border-[#EBD7BA]">
          <ShieldCheck className="h-4 w-4" />
          <span>RLS Enforced &bull; Double-Barrier Security</span>
        </div>
      </header>

      {/* Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-soft-md border border-[#E8DFD5] space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-[#FAF6EF] text-[#9B1C31] border border-[#EBD7BA] shadow-inner mb-1">
              <Gem className="h-7 w-7 text-[#9B1C31]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#2B2B2B]">
              Sign in to Your Account
            </h2>
            <p className="text-xs text-[#66615C]">
              Unified login portal for Owners and Staff members
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 leading-relaxed animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Mobile"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. owner or staff1"
              leftAddon={<User className="h-4 w-4" />}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              leftAddon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Secure Sign In
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-4 border-t border-[#F5EFE6] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#8C857E]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Demo Testing Logins
              </span>
              <span className="text-[10px] text-[#B8893B] font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> One-Click Fill
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('owner', 'Owner@123')}
                className="py-2.5 px-3 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] text-left hover:bg-[#F5EBDD] transition"
              >
                <div className="text-xs font-bold text-[#9B1C31]">Owner Role</div>
                <div className="text-[11px] text-[#66615C]">owner / Owner@123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff1', 'Staff@123')}
                className="py-2.5 px-3 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] text-left hover:bg-[#F5EBDD] transition"
              >
                <div className="text-xs font-bold text-[#B8893B]">Staff Role</div>
                <div className="text-[11px] text-[#66615C]">staff1 / Staff@123</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-[#8C857E]">
        Kumkum Payal &bull; Enterprise Jewellery Accounting & Job Work &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
