'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Settings, ShieldCheck, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings" description="Manage your account and storage preferences.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Privacy</h3>
          <p className="mt-2 text-sm text-slate-400">Secure sharing, role-based access, and retention settings.</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
            <Bell className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Notifications</h3>
          <p className="mt-2 text-sm text-slate-400">Control email and app notifications for file activity.</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
            <Settings className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Workspace</h3>
          <p className="mt-2 text-sm text-slate-400">Update storage preferences and team default settings.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
