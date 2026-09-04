'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFileStore } from '@/lib/stores/fileStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { fileAPI, shareAPI } from '@/lib/api';
import { Plus, Upload, FolderOpen, MoreVertical, Download, Share2, Heart, Folder, X, Trash2, Copy, Check, UserPlus, Link2, Eye, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FileExplorer() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId');
  const searchQuery = searchParams.get('search') || '';
  const { files, folders, isLoading, error, loadFolders, loadFiles, createFolder, uploadFile, toggleFavorite, deleteFile } = useFileStore();
  const { user } = useAuthStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<{ id: string; name: string } | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [shareExpiry, setShareExpiry] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [shares, setShares] = useState<any[]>([]);
  const [publicLinks, setPublicLinks] = useState<any[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadFolders(parentId || undefined);
      loadFiles(parentId || undefined, searchQuery);
    }
  }, [user, parentId, searchQuery, loadFolders, loadFiles]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      await createFolder(newFolderName, parentId || undefined);
      setNewFolderName('');
      setShowCreateMenu(false);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    setIsUploading(true);
    setUploadError('');

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await uploadFile(file, parentId || undefined);
      }
      setNotice('Files uploaded successfully');
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (file: { id: string; name: string }) => {
    try {
      setMenuOpenId(null);
      const response = await fileAPI.download(file.id);
      const blob = response instanceof Blob ? response : new Blob([response as BlobPart], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setNotice(`${file.name} downloaded`);
    } catch (err: any) {
      setNotice(err?.message || 'Download failed');
    }
  };

  const handleShare = async (file: { id: string; name: string }) => {
    try {
      setMenuOpenId(null);
      setShareFile(file);
      setShareLoading(true);
      const [shareResponse, linkResponse] = await Promise.all([
        shareAPI.getShares('file', file.id) as Promise<any>,
        shareAPI.getPublicLinks('file', file.id) as Promise<any>,
      ]);
      setShares(shareResponse.shares || []);
      setPublicLinks(linkResponse.links || []);
    } catch (err: any) {
      setNotice(err?.message || 'Could not load sharing settings');
    } finally {
      setShareLoading(false);
    }
  };

  const addUserShare = async () => {
    if (!shareFile || !shareEmail.trim()) return;
    setShareLoading(true);
    try {
      const response = await shareAPI.shareWithUser({ itemId: shareFile.id, itemType: 'file', sharedWithEmail: shareEmail.trim(), permission: sharePermission }) as any;
      setShares((current) => [...current.filter((share) => share.id !== response.share.id), response.share]);
      setShareEmail('');
      setNotice(`Shared ${shareFile.name}`);
    } catch (err: any) {
      setNotice(err?.message || 'Could not share with this user');
    } finally {
      setShareLoading(false);
    }
  };

  const createLink = async () => {
    if (!shareFile) return;
    setShareLoading(true);
    try {
      const response = await shareAPI.createPublicLink({ itemId: shareFile.id, itemType: 'file', expiresAt: shareExpiry ? new Date(shareExpiry).toISOString() : undefined, password: sharePassword || undefined }) as any;
      setPublicLinks((current) => [response.link, ...current]);
      setShareExpiry('');
      setSharePassword('');
      setNotice('Public link created');
    } catch (err: any) {
      setNotice(err?.message || 'Could not create public link');
    } finally {
      setShareLoading(false);
    }
  };

  const revokeUserShare = async (shareId: string) => {
    await shareAPI.revokeShare(shareId);
    setShares((current) => current.filter((share) => share.id !== shareId));
  };

  const revokeLink = async (linkId: string) => {
    await shareAPI.revokePublicLink(linkId);
    setPublicLinks((current) => current.filter((link) => link.id !== linkId));
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setNotice('Public link copied');
  };

  const handleFavorite = async (file: { id: string; name: string }) => {
    try {
      setMenuOpenId(null);
      await toggleFavorite(file.id);
      await loadFiles(parentId || undefined);
      setNotice(`${file.name} updated`);
    } catch (err: any) {
      setNotice(err?.message || 'Could not update favorite');
    }
  };

  const handleDelete = async (file: { id: string; name: string }) => {
    try {
      setMenuOpenId(null);
      await deleteFile(file.id);
      await loadFiles(parentId || undefined);
      setNotice(`${file.name} moved to trash`);
    } catch (err: any) {
      setNotice(err?.message || 'Delete failed');
    }
  };

  const formatFileSize = (bytes: number | bigint) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = Number(bytes);
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('sheet')) return '📊';
    return '📎';
  };

  return (
    <main className="h-full overflow-auto bg-[#020817] p-6">
      <div className="flex items-center justify-between border-b border-cyan-500/15 pb-5">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">My Files</h2>
          <p className="mt-1 text-sm text-slate-400">
            {folders.length} folders · {files.length} files
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-linear-to-r from-cyan-500/10 to-violet-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
            >
              <Plus className="h-4 w-4" />
              New
            </button>

            {showCreateMenu && (
              <div className="absolute right-0 z-20 mt-3 w-52 overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#020817]/95 shadow-[0_20px_40px_rgba(34,211,238,0.12)]">
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    setIsCreatingFolder(true);
                  }}
                  className="flex w-full items-center gap-3 border-b border-cyan-500/15 px-4 py-3 text-left text-sm text-cyan-300 transition hover:bg-cyan-500/8"
                >
                  <FolderOpen className="h-4 w-4" />
                  New folder
                </button>

                <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-cyan-300 transition hover:bg-cyan-500/8">
                  <Upload className="h-4 w-4" />
                  Upload files
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/20 bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-cyan-200 hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload'}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {isCreatingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[420px] rounded-[26px] border border-cyan-500/20 bg-[#020817] p-6 shadow-[0_24px_80px_rgba(34,211,238,0.14)]">
            <h3 className="text-2xl font-black text-white">Create new folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              autoFocus
              className="mt-5 w-full rounded-xl border border-cyan-500/20 bg-[#0f172a] px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              placeholder="Folder name"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
                className="flex-1 rounded-xl bg-linear-to-r from-cyan-500 to-purple-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingFolder ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="flex-1 rounded-xl border border-cyan-500/20 bg-[#0f172a] px-4 py-3 font-semibold text-cyan-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          <Check className="h-4 w-4" />
          {notice}
        </div>
      )}

      {isLoading && (
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            <p className="mt-4 text-slate-300">Loading files...</p>
          </div>
        </div>
      )}

      {!isLoading && (error || uploadError) && (
        <div className="mt-8 flex items-start justify-between rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-200">
          <span>{error || uploadError}</span>
          <button onClick={() => setUploadError('')} className="ml-4 hover:text-red-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-4">
            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center justify-between rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-4 hover:border-cyan-400/60">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500/20 to-violet-500/15 text-cyan-300">
                    <Folder className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{folder.name}</div>
                    <div className="text-sm text-slate-400">
                      {folder._count?.files || 0} items
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {folder.createdAt ? formatDistanceToNow(new Date(folder.createdAt), { addSuffix: true }) : 'recently'}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="rounded-2xl border border-cyan-500/20 bg-[#0b1220] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-xl">{getFileIcon(file.mimeType)}</div>
                    <div>
                      <div className="truncate text-sm font-semibold text-white">{file.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{formatFileSize(file.size)} · {file.mimeType || 'file'}</div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId((prev) => prev === file.id ? null : file.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                      aria-label={`Open file actions for ${file.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuOpenId === file.id && (
                      <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-cyan-500/20 bg-[#020817]/95 p-1 shadow-[0_20px_40px_rgba(34,211,238,0.12)] backdrop-blur-xl">
                        <button onClick={() => handleDownload(file)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10">
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button onClick={() => handleShare(file)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10">
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                        <button onClick={() => handleFavorite(file)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10">
                          <Heart className={file.isFavorite ? 'h-4 w-4 fill-rose-400 text-rose-400' : 'h-4 w-4'} />
                          {file.isFavorite ? 'Unstar' : 'Star'}
                        </button>
                        <button onClick={() => handleDelete(file)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-cyan-500/15 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <button onClick={() => handleDownload(file)} className="rounded p-1 hover:bg-slate-800 hover:text-cyan-300">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleShare(file)} className="rounded p-1 hover:bg-slate-800 hover:text-cyan-300">
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleFavorite(file)} className="rounded p-1 hover:bg-slate-800 hover:text-cyan-300">
                      <Heart className={file.isFavorite ? 'h-3.5 w-3.5 fill-rose-400 text-rose-400' : 'h-3.5 w-3.5'} />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && folders.length === 0 && files.length === 0 && (
        <div className="mt-8 rounded-[28px] border border-dashed border-cyan-500/25 bg-[#0b1220]/60 p-10 text-center">
          <div className="mb-4 flex justify-center text-5xl">📁</div>
          <h3 className="text-2xl font-black text-white">No files yet</h3>
          <p className="mt-2 text-slate-400">Create a folder or upload your first file to get started.</p>
        </div>
      )}

      {shareFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-cyan-500/25 bg-[#07101f] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Sharing</p><h3 className="mt-1 text-2xl font-black text-white">{shareFile.name}</h3></div>
              <button onClick={() => setShareFile(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close sharing dialog"><X className="h-5 w-5" /></button>
            </div>
            {shareLoading && <p className="mt-5 text-sm text-cyan-300">Updating sharing settings...</p>}

            <section className="mt-6 border-t border-cyan-500/15 pt-5">
              <div className="mb-3 flex items-center gap-2 text-white"><UserPlus className="h-4 w-4 text-cyan-300" /><h4 className="font-bold">Share to users</h4></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="person@example.com" className="min-w-0 flex-1 rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400" />
                <select value={sharePermission} onChange={(e) => setSharePermission(e.target.value as 'VIEWER' | 'EDITOR')} className="rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none"><option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option></select>
                <button onClick={addUserShare} disabled={shareLoading || !shareEmail.trim()} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">Share</button>
              </div>
              <div className="mt-3 space-y-2">{shares.map((share) => <div key={share.id} className="flex items-center justify-between rounded-xl bg-[#0f172a] px-3 py-2 text-sm"><span className="text-slate-200">{share.sharedWith?.name || share.sharedWith?.email}</span><span className="flex items-center gap-3 text-slate-400">{share.permission === 'EDITOR' ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{share.permission}<button onClick={() => revokeUserShare(share.id)} className="text-red-300 hover:text-red-200">Revoke</button></span></div>)}</div>
            </section>

            <section className="mt-6 border-t border-cyan-500/15 pt-5">
              <div className="mb-3 flex items-center gap-2 text-white"><Link2 className="h-4 w-4 text-cyan-300" /><h4 className="font-bold">Public links</h4></div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input type="datetime-local" value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)} className="rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none" />
                <input type="password" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} placeholder="Optional password" className="rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none" />
                <button onClick={createLink} disabled={shareLoading} className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-200 disabled:opacity-50">Create link</button>
              </div>
              <div className="mt-3 space-y-2">{publicLinks.map((link) => <div key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#0f172a] px-3 py-2 text-sm"><span className="text-slate-300">{link.expiresAt ? `Expires ${formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}` : 'Never expires'}{link.password ? ' · Password protected' : ''}</span><span className="flex items-center gap-3"><button onClick={() => copyLink(link.publicUrl)} className="text-cyan-300 hover:text-cyan-200" aria-label="Copy public link"><Copy className="h-4 w-4" /></button><button onClick={() => revokeLink(link.id)} className="text-red-300 hover:text-red-200">Revoke</button></span></div>)}</div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
