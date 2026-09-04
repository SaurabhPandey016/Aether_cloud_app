'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Download, ExternalLink, FolderOpen, Share2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fileAPI, searchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

type SharedFile = { id: string; name: string; mimeType: string; size: string; owner?: { name?: string; email?: string }; shares?: { permission: string }[] };
type SharedFolder = { id: string; name: string; owner?: { name?: string; email?: string }; _count?: { files: number; children: number }; shares?: { permission: string }[] };

export default function SharedPage() {
  const router = useRouter();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [folders, setFolders] = useState<SharedFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    searchAPI.getSharedWithMe().then((response: any) => {
      setFiles(response.files || []);
      setFolders(response.folders || []);
    }).catch((reason: any) => setError(reason?.message || 'Unable to load shared items')).finally(() => setLoading(false));
  }, []);

  const download = async (file: SharedFile) => {
    const blob = await fileAPI.download(file.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Shared With Me"
      description="Files and folders shared by your teammates."
      action={<div className="flex items-center gap-2 text-sm text-slate-400"><Users className="h-4 w-4 text-cyan-300" /> {files.length + folders.length} shared items</div>}
    >
      {loading && <div className="rounded-3xl border border-cyan-500/15 bg-[#0b1220] p-12 text-center text-slate-400">Loading shared items...</div>}
      {error && <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-5 text-red-200">{error}</div>}
      {!loading && !error && files.length + folders.length === 0 && <div className="rounded-3xl border border-dashed border-cyan-500/25 bg-[#0b1220]/60 p-12 text-center"><Share2 className="mx-auto h-10 w-10 text-cyan-300" /><h3 className="mt-5 text-2xl font-black text-white">Nothing shared with you yet</h3><p className="mt-2 text-slate-400">Files and folders shared by teammates will appear here.</p></div>}
      {!loading && !error && (files.length > 0 || folders.length > 0) && <div className="space-y-8">
        {folders.length > 0 && <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Shared folders</h3><div className="grid gap-4 md:grid-cols-2">{folders.map((folder) => <div key={folder.id} className="flex items-center justify-between rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-5"><div className="flex min-w-0 items-center gap-3"><FolderOpen className="h-7 w-7 shrink-0 text-cyan-300" /><div className="min-w-0"><h4 className="truncate font-bold text-white">{folder.name}</h4><p className="mt-1 text-xs text-slate-400">{folder._count?.files || 0} files · {folder.shares?.[0]?.permission || 'VIEWER'} · from {folder.owner?.name || folder.owner?.email}</p></div></div><button onClick={() => router.push(`/dashboard?parentId=${folder.id}`)} className="rounded-lg p-2 text-cyan-300 hover:bg-cyan-500/10" aria-label={`Open ${folder.name}`}><ExternalLink className="h-4 w-4" /></button></div>)}</div></section>}
        {files.length > 0 && <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Shared files</h3><div className="grid gap-4 md:grid-cols-2">{files.map((file) => <div key={file.id} className="flex items-center justify-between rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">{file.mimeType.startsWith('image/') ? 'IMG' : 'FILE'}</div><div className="min-w-0"><h4 className="truncate font-bold text-white">{file.name}</h4><p className="mt-1 text-xs text-slate-400">{file.mimeType} · {file.shares?.[0]?.permission || 'VIEWER'} · from {file.owner?.name || file.owner?.email}</p></div></div><button onClick={() => void download(file)} className="rounded-lg p-2 text-cyan-300 hover:bg-cyan-500/10" aria-label={`Download ${file.name}`}><Download className="h-4 w-4" /></button></div>)}</div></section>}
      </div>}
    </DashboardLayout>
  );
}
