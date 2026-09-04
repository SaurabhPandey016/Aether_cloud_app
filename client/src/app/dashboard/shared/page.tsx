'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Share2, ArrowRight } from 'lucide-react';

export default function SharedPage() {
  return (
    <DashboardLayout
      title="Shared With Me"
      description="Files and folders shared by your teammates."
      action={
        <button className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
          View invites
        </button>
      }
    >
      <div className="rounded-[28px] border border-dashed border-cyan-500/25 bg-[#0b1220]/60 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
          <Share2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-white">No shared files yet</h3>
        <p className="mt-2 text-slate-400">Invite teammates to share files and folders with you.</p>
        <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-purple-600 px-5 py-3 font-semibold text-white">
          Invite people <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </DashboardLayout>
  );
}
