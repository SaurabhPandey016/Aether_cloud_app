'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { Search, LogOut, User, Settings } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (pathname !== '/dashboard') return;
    const timer = window.setTimeout(() => {
      const query = searchQuery.trim();
      router.replace(query ? `/dashboard?search=${encodeURIComponent(query)}` : '/dashboard');
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pathname, router, searchQuery]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-cyan-500/15 bg-[#020817]/85 backdrop-blur-xl">
      <div className="flex max-w-full items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex min-w-fit items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-purple-600 shadow-[0_0_25px_rgba(34,211,238,0.35)]">
            <span className="text-lg font-black text-white">A</span>
          </div>
          <h1 className="hidden text-xl font-black tracking-tight text-white sm:block">Aether Cloud</h1>
        </Link>

        <form onSubmit={handleSearch} className="mx-4 hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-cyan-500/20 bg-[#0f172a] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </form>

        <div className="relative ml-auto">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-800/60"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-purple-600 text-sm font-bold text-white shadow-[0_0_25px_rgba(168,85,247,0.35)]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-white sm:inline">{user?.name?.split(' ')[0]}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#020817]/95 shadow-[0_18px_40px_rgba(8,145,178,0.18)] backdrop-blur-xl">
              <div className="border-b border-cyan-500/15 bg-linear-to-r from-cyan-500/8 to-violet-500/8 p-4">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-cyan-300">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push('/dashboard/profile');
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-cyan-300 transition hover:bg-cyan-500/8"
              >
                <User className="h-4 w-4" />
                Profile Settings
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push('/dashboard/settings');
                }}
                className="flex w-full items-center gap-3 border-b border-cyan-500/15 px-4 py-3 text-sm text-cyan-300 transition hover:bg-cyan-500/8"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-300 transition hover:bg-red-500/8"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
