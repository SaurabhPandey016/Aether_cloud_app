'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Download, Share2, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fileAPI, shareAPI } from '@/lib/api';

export default function StarredPage() {
  const [files, setFiles] = useState<any[]>([]);

  const loadFiles = () => fileAPI.getFavorites().then((response: any) => setFiles(response.files || [])).catch(() => setFiles([]));

  useEffect(() => {
    loadFiles();
  }, []);

  const download = async (file: any) => {
    const blob = await fileAPI.download(file.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const share = async (file: any) => {
    const response = await shareAPI.getPublicLinks('file', file.id) as any;
    const link = response.links?.[0];
    if (link) await navigator.clipboard.writeText(link.publicUrl);
  };

  return (
    <DashboardLayout
      title="Starred"
      description="Important files you pinned for quick access."
    >
      {files.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{files.map((file) => <div key={file.id} className="rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-5"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Star className="h-5 w-5 shrink-0 fill-rose-400 text-rose-400" /><div className="min-w-0"><h3 className="truncate font-semibold text-white">{file.name}</h3><p className="text-xs text-slate-400">{file.mimeType}</p></div></div><div className="flex items-center gap-1"><button onClick={() => download(file)} aria-label="Download file" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"><Download className="h-4 w-4" /></button><button onClick={() => share(file)} aria-label="Copy share link" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"><Share2 className="h-4 w-4" /></button><button onClick={async () => { await fileAPI.toggleFavorite(file.id); loadFiles(); }} aria-label="Remove from starred" className="rounded-lg p-2 text-rose-300 hover:bg-slate-800"><Trash2 className="h-4 w-4" /></button></div></div></div>)}</div> : <div className="rounded-[28px] border border-dashed border-cyan-500/25 bg-[#0b1220]/60 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
          <Star className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-white">No starred files</h3>
        <p className="mt-2 text-slate-400">Mark important files with a star to keep them close.</p>
      </div>}
    </DashboardLayout>
  );
}
