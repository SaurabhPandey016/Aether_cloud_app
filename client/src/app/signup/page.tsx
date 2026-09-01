'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';
import { Mail, Lock, User, UserPlus } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!formData.name || !formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      await signup(formData.email, formData.password, formData.name);
      router.push('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_26%),linear-gradient(135deg,#020817_0%,#0b1220_50%,#020817_100%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-purple-600 shadow-[0_0_30px_rgba(34,211,238,0.35)]">
              <span className="text-xl font-black text-white">A</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Aether Cloud</h1>
          </div>
          <p className="text-base text-slate-300">Create a new account</p>
        </div>

        <div className="rounded-[28px] border border-cyan-500/20 bg-[#0b1220]/80 p-7 shadow-[0_20px_70px_rgba(8,145,178,0.12)] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-cyan-300">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-cyan-500/20 bg-[#111827] py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-cyan-300">Email Address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-cyan-500/20 bg-[#111827] py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-cyan-300">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cyan-500/20 bg-[#111827] py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">At least 8 characters required</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-cyan-300">Confirm Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cyan-500/20 bg-[#111827] py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {(error || localError) && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error || localError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-purple-600 px-4 py-3 font-semibold text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <UserPlus className="h-4 w-4" />
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 border-t border-cyan-500/15 pt-5 text-center text-sm text-slate-300">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-cyan-300 transition hover:text-cyan-200">Sign in</Link>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3">
          {[
            { icon: '🔒', label: 'Secure' },
            { icon: '⚡', label: 'Fast' },
            { icon: '📱', label: 'Ready' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/3 px-3 py-4 text-center">
              <div className="text-2xl">{item.icon}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
