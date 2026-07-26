'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, Mail, MapPin, BadgeInfo, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import StarlightBg from '@/components/ui/starlight-bg';

export default function SignupPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    fullName: '',
    kgid: '',
    station: '',
    email: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/catalyst/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || 'Registration failed. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black/50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Starlight background for auth pages */}
      <StarlightBg />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <p className="cmd-eyebrow text-red-500 mb-2">KSP Identity Access Management</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Personnel Registration</h1>
        </div>

        <div className="cmd-panel bg-black/70 backdrop-blur-md border border-white/10 p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="bg-red-950/40 border border-red-900/50 p-3 rounded-lg flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400 leading-relaxed">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-950/40 border border-emerald-900/50 p-3 rounded-lg flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-400 leading-relaxed">
                  Account registered successfully! Redirecting to login...
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-data text-zinc-500 tracking-widest uppercase mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Officer Name"
                  className="bg-zinc-950/50 border border-zinc-700/80 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full pl-10 p-2.5 placeholder-zinc-600 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-data text-zinc-500 tracking-widest uppercase mb-2">
                  KGID Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BadgeInfo className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    name="kgid"
                    required
                    value={formData.kgid}
                    onChange={handleChange}
                    placeholder="e.g. 123456"
                    className="bg-zinc-950/50 border border-zinc-700/80 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full pl-10 p-2.5 placeholder-zinc-600 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-data text-zinc-500 tracking-widest uppercase mb-2">
                  Station / District
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    name="station"
                    required
                    value={formData.station}
                    onChange={handleChange}
                    placeholder="e.g. M.G. Road PS"
                    className="bg-zinc-950/50 border border-zinc-700/80 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full pl-10 p-2.5 placeholder-zinc-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-data text-zinc-500 tracking-widest uppercase mb-2">
                Police Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="officer@ksp.gov.in"
                  className="bg-zinc-950/50 border border-zinc-700/80 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full pl-10 p-2.5 placeholder-zinc-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-data text-zinc-500 tracking-widest uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="bg-zinc-950/50 border border-zinc-700/80 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full pl-10 p-2.5 placeholder-zinc-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success || !formData.fullName || !formData.email || !formData.password || !formData.kgid || !formData.station}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-zinc-700 border border-red-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:shadow-none mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
