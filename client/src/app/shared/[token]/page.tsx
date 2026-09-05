'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, LockKeyhole, Share2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type SharedItem = { name: string; mimeType?: string; size?: string };

export default function SharedFilePage() {
  const { token } = useParams<{ token: string }>();
  const [item, setItem] = useState<SharedItem | null>(null);
  const [itemType, setItemType] = useState<'file' | 'folder'>('file');
  const [permission, setPermission] = useState('VIEWER');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const loadLink = async () => {
    setError('');
    const response = await fetch(`${API_URL}/shares/public-link/${token}/access`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: password || undefined }) });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) setNeedsPassword(true);
      setError(data.message || 'This share link is unavailable.');
      return;
    }
    setItem(data.item);
    setName(data.item?.name || '');
    setItemType(data.itemType || 'file');
    setPermission(data.permission || 'VIEWER');
    setNeedsPassword(false);
  };

  useEffect(() => { if (token) loadLink(); }, [token]);

  const download = async () => {
    const response = await fetch(`${API_URL}/shares/public-link/${token}/download?password=${encodeURIComponent(password)}`);
    if (!response.ok) { setError('Download is unavailable for this link.'); return; }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = itemType === 'folder' ? `${item?.name || 'shared-folder'}.zip` : item?.name || 'shared-file';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveName = async () => {
    const response = await fetch(`${API_URL}/shares/public-link/${token}/item`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await response.json();
    if (!response.ok) { setError(data.message || 'You cannot edit this shared item.'); return; }
    setItem((current) => current ? { ...current, name: data.item.name } : current);
    setEditing(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020817] p-6 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-cyan-500/20 bg-[#0b1220] p-8 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300"><Share2 /></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">AetherCloud shared file</p>
        {editing ? <input value={name} onChange={(event) => setName(event.target.value)} className="mt-3 w-full rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-2 text-2xl font-black text-white" /> : <h1 className="mt-2 wrap-break-word text-3xl font-black">{item?.name || 'Shared item'}</h1>}
        {item && <p className="mt-2 text-sm text-slate-400">{item.mimeType || 'File'} · Access: {permission === 'EDITOR' ? 'Editor' : 'Viewer'}</p>}
        {needsPassword && <div className="mt-6 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200"><LockKeyhole className="h-4 w-4" /> Password required</div>}
        {needsPassword && <input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter link password" className="mt-4 w-full rounded-xl border border-cyan-500/20 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-cyan-400" />}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        {needsPassword && <button onClick={loadLink} className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950">Unlock link</button>}
        {item && <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={download} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950"><Download className="h-4 w-4" /> Download {itemType === 'folder' ? 'folder' : 'file'}</button>{permission === 'EDITOR' && (editing ? <button onClick={() => void saveName()} className="rounded-xl border border-cyan-400/30 px-4 py-3 font-semibold text-cyan-200">Save name</button> : <button onClick={() => setEditing(true)} className="rounded-xl border border-cyan-400/30 px-4 py-3 font-semibold text-cyan-200">Edit name</button>)}</div>}
      </section>
    </main>
  );
}
