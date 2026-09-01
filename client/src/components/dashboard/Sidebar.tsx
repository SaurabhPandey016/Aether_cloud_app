'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useFileStore } from '@/lib/stores/fileStore';
import { Home, Share2, Star, Trash2, Settings } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setCurrentFolder } = useFileStore();

  const menuItems = [
    {
      icon: Home,
      label: 'My Files',
      onClick: () => {
        setCurrentFolder(null);
        router.push('/dashboard');
      },
      path: '/dashboard',
    },
    {
      icon: Share2,
      label: 'Shared With Me',
      onClick: () => router.push('/dashboard/shared'),
      path: '/dashboard/shared',
    },
    {
      icon: Star,
      label: 'Starred',
      onClick: () => router.push('/dashboard/starred'),
      path: '/dashboard/starred',
    },
    {
      icon: Trash2,
      label: 'Trash',
      onClick: () => router.push('/dashboard/trash'),
      path: '/dashboard/trash',
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => router.push('/dashboard/settings'),
      path: '/dashboard/settings',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col border-r border-cyan-500/15 bg-[#050c18]/90 pt-20 backdrop-blur-xl">
      <nav className="flex-1 space-y-2 p-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                isActive
                  ? 'border border-cyan-500/30 bg-linear-to-r from-cyan-500/15 to-violet-500/10 text-cyan-300'
                  : 'text-slate-300 hover:bg-slate-900/60 hover:text-cyan-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="h-2 w-2 rounded-full bg-cyan-300" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-cyan-500/15 bg-linear-to-t from-cyan-500/8 to-transparent p-5">
        <div className="mb-4 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300">
          <span>Storage</span>
          <span className="text-slate-400">2.5 GB</span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full border border-cyan-500/15 bg-slate-900/80">
          <div className="h-full w-[33%] rounded-full bg-linear-to-r from-cyan-500 to-purple-600" />
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">2.5 GB / 100 GB</p>

        <button className="mt-5 w-full rounded-xl bg-linear-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(34,211,238,0.25)] transition hover:brightness-110">
          Upgrade Plan
        </button>
      </div>
    </aside>
  );
}
