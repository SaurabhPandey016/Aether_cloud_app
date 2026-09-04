'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Eye, FolderOpen, LoaderCircle, Share2, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { searchAPI, shareAPI } from '@/lib/api';

type Recipient = { id: string; name?: string; email: string };
type Access = { id: string; permission: 'VIEWER' | 'EDITOR'; sharedWith: Recipient };
type PublicAccess = { id: string; recipientEmail?: string; permission: 'VIEWER' | 'EDITOR'; expiresAt?: string };
type SharedFile = { id: string; name: string; mimeType: string; shares: Access[]; publicLinks?: PublicAccess[] };
type SharedFolder = { id: string; name: string; _count?: { files: number; children: number }; shares: Access[]; publicLinks?: PublicAccess[] };

export default function SharedPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [folders, setFolders] = useState<SharedFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadSharedItems = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await searchAPI.getSharedByMe() as any;
      setFiles(response.files || []);
      setFolders(response.folders || []);
    } catch (reason: any) {
      setError(reason?.message || 'Unable to load shared items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSharedItems(); }, []);

  const revoke = async (shareId: string) => {
    setBusyId(shareId);
    try {
      await shareAPI.revokeShare(shareId);
      await loadSharedItems();
    } catch (reason: any) {
      setError(reason?.message || 'Unable to revoke access');
    } finally {
      setBusyId(null);
    }
  };

  const revokeLink = async (linkId: string) => {
    setBusyId(linkId);
    try {
      await shareAPI.revokePublicLink(linkId);
      await loadSharedItems();
    } catch (reason: any) {
      setError(reason?.message || 'Unable to delete public link');
    } finally {
      setBusyId(null);
    }
  };

  const accessRows = (shares: Access[], publicLinks: PublicAccess[] = []) => [...shares.map((share) => (
    <div key={share.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/10 bg-[#0f172a] px-3 py-3">
      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-200"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">{share.sharedWith.name?.charAt(0).toUpperCase() || '@'}</span><span className="min-w-0"><span className="block truncate font-medium">{share.sharedWith.name || share.sharedWith.email}</span><span className="block truncate text-xs text-slate-500">{share.sharedWith.email}</span></span></div>
      <div className="flex items-center gap-3 text-xs text-slate-400"><span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{share.permission === 'EDITOR' ? 'Editor' : 'Viewer'}</span><button onClick={() => void revoke(share.id)} disabled={busyId === share.id} className="inline-flex items-center gap-1 rounded-lg border border-red-400/20 px-2.5 py-1.5 text-red-300 hover:bg-red-500/10 disabled:opacity-50">{busyId === share.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Remove access</button></div>
    </div>
  )), ...publicLinks.map((link) => <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/10 bg-[#0f172a] px-3 py-3"><div className="flex min-w-0 items-center gap-2 text-sm text-slate-200"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-300">@</span><span className="min-w-0"><span className="block truncate font-medium">{link.recipientEmail || 'Public link recipient'}</span><span className="block text-xs text-slate-500">Public link{link.expiresAt ? ` · expires ${new Date(link.expiresAt).toLocaleString()}` : ''}</span></span></div><div className="flex items-center gap-3 text-xs text-slate-400"><span>{link.permission === 'EDITOR' ? 'Editor' : 'Viewer'}</span><button onClick={() => void revokeLink(link.id)} disabled={busyId === link.id} className="inline-flex items-center gap-1 rounded-lg border border-red-400/20 px-2.5 py-1.5 text-red-300 hover:bg-red-500/10 disabled:opacity-50">{busyId === link.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Revoke access</button></div></div>)];

  return (
    <DashboardLayout title="Shared Items" description="Manage files and folders you have shared with other people." action={<div className="flex items-center gap-2 text-sm text-slate-400"><Users className="h-4 w-4 text-cyan-300" /> {files.length + folders.length} shared items</div>}>
      {loading && <div className="flex min-h-64 items-center justify-center rounded-3xl border border-cyan-500/15 bg-[#0b1220] text-slate-400"><LoaderCircle className="mr-3 h-5 w-5 animate-spin text-cyan-300" /> Loading shared items...</div>}
      {!loading && error && <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-red-200">{error}<button onClick={() => void loadSharedItems()} className="ml-4 underline">Retry</button></div>}
      {!loading && !error && files.length + folders.length === 0 && <div className="rounded-3xl border border-dashed border-cyan-500/25 bg-[#0b1220]/60 p-12 text-center"><Share2 className="mx-auto h-10 w-10 text-cyan-300" /><h3 className="mt-5 text-2xl font-black text-white">Nothing shared yet</h3><p className="mt-2 text-slate-400">When you share a file or folder, recipients and permissions will appear here.</p></div>}
      {!loading && !error && (files.length > 0 || folders.length > 0) && <div className="space-y-6">
        {folders.map((folder) => <section key={folder.id} className="rounded-3xl border border-cyan-500/15 bg-[#0b1220] p-5"><div className="flex items-center gap-3"><FolderOpen className="h-6 w-6 text-cyan-300" /><div><h3 className="font-bold text-white">{folder.name}</h3><p className="text-xs text-slate-500">Folder · {folder._count?.files || 0} files</p></div></div><div className="mt-4 space-y-2">{accessRows(folder.shares, folder.publicLinks)}</div></section>)}
        {files.map((file) => <section key={file.id} className="rounded-3xl border border-cyan-500/15 bg-[#0b1220] p-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-xs text-cyan-300">FILE</div><div><h3 className="font-bold text-white">{file.name}</h3><p className="text-xs text-slate-500">{file.mimeType}</p></div></div><div className="mt-4 space-y-2">{accessRows(file.shares, file.publicLinks)}</div></section>)}
      </div>}
    </DashboardLayout>
  );
}
