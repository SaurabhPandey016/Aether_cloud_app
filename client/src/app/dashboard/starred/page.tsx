'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fileAPI } from '@/lib/api';

export default function StarredPage() {
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    fileAPI.getFavorites().then((response: any) => setFiles(response.files || [])).catch(() => setFiles([]));
  }, []);

  return (
    <DashboardLayout
      title="Starred"
      description="Important files you pinned for quick access."
    >
      {files.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{files.map((file) => <div key={file.id} className="rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-5"><div className="flex items-center gap-3"><Star className="h-5 w-5 fill-rose-400 text-rose-400" /><div><h3 className="font-semibold text-white">{file.name}</h3><p className="text-xs text-slate-400">{file.mimeType}</p></div></div></div>)}</div> : <div className="rounded-[28px] border border-dashed border-cyan-500/25 bg-[#0b1220]/60 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
          <Star className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-white">No starred files</h3>
        <p className="mt-2 text-slate-400">Mark important files with a star to keep them close.</p>
      </div>}
    </DashboardLayout>
  );
}
