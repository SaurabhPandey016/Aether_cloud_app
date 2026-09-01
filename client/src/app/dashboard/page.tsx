'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import FileExplorer from '@/components/dashboard/FileExplorer';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, getCurrentUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated && !authLoading) {
      getCurrentUser().catch(() => {
        router.push('/login');
      });
    }
  }, [mounted, isAuthenticated, authLoading, getCurrentUser, router]);

  if (!mounted || authLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020817]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#020817] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden pt-20">
          <FileExplorer />
        </main>
      </div>
    </div>
  );
}
