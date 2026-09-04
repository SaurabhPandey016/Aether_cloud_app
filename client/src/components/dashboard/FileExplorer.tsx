'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFileStore } from '@/lib/stores/fileStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { fileAPI, folderAPI, shareAPI } from '@/lib/api';
import { Upload, MoreVertical, Download, Share2, Heart, X, Trash2, Copy, Check, UserPlus, Link2, Eye, Pencil, FileUp, PencilLine, FolderInput, Filter, FolderOpen, ChevronRight, Plus, LoaderCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FileExplorer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const parentId = searchParams.get('parentId');
  const searchQuery = searchParams.get('search') || '';
  const { files, folders, isLoading, error, loadFolders, loadFiles, createFolder, uploadFile, toggleFavorite, deleteFile, renameFile, moveFile } = useFileStore();
  const { user } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<{ id: string; name: string; itemType: 'file' | 'folder' } | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [shareExpiry, setShareExpiry] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [shares, setShares] = useState<any[]>([]);
  const [publicLinks, setPublicLinks] = useState<any[]>([]);
  const [newLinkIds, setNewLinkIds] = useState<string[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [moveItem, setMoveItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [moveDestination, setMoveDestination] = useState('');
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [allFolders, setAllFolders] = useState<typeof folders>([]);
  const [moveFoldersLoading, setMoveFoldersLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFolders(parentId || undefined);
      loadFiles(parentId || undefined, searchQuery);
    }
  }, [user, parentId, searchQuery, loadFolders, loadFiles]);

  useEffect(() => {
    if (!parentId) {
      setBreadcrumbs([]);
      return;
    }
    folderAPI.getBreadcrumbs(parentId).then((response: any) => setBreadcrumbs(response.breadcrumbs || [])).catch(() => setBreadcrumbs([]));
  }, [parentId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

  const uploadFiles = useCallback(async (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;
    setIsUploading(true);
    setUploadError('');
    try {
      for (const file of selectedFiles) await uploadFile(file, parentId || undefined);
      setNotice(`${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'} uploaded successfully`);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [parentId, uploadFile]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isUploading) void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const handleDownload = async (file: { id: string; name: string }) => {
    setActionBusy(`download:${file.id}`);
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
    } finally {
      setActionBusy(null);
    }
  };

  const handleShare = async (file: { id: string; name: string; itemType?: 'file' | 'folder' }) => {
    try {
      setMenuOpenId(null);
      setShareFile({ ...file, itemType: file.itemType || 'file' });
      setNewLinkIds([]);
      setShareLoading(true);
      const [shareResponse, linkResponse] = await Promise.all([
        shareAPI.getShares(file.itemType || 'file', file.id) as Promise<any>,
        shareAPI.getPublicLinks(file.itemType || 'file', file.id) as Promise<any>,
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
    const normalizedEmail = shareEmail.trim().toLowerCase();
    if (!shareFile || !normalizedEmail) {
      setNotice('Enter a recipient email first.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setNotice('Enter a valid recipient email.');
      return;
    }
    setShareLoading(true);
    try {
      const response = await shareAPI.shareWithLink({ itemId: shareFile.id, itemType: shareFile.itemType, recipientEmail: normalizedEmail, permission: sharePermission, expiresAt: shareExpiry ? new Date(shareExpiry).toISOString() : undefined, password: sharePassword || undefined }) as any;
      setPublicLinks((current) => [response.link, ...current]);
      setNewLinkIds((current) => [response.link.id, ...current]);
      setShareEmail('');
      setShareExpiry('');
      setSharePassword('');
      await copyLink(response.link.publicUrl);
      setNotice(`Link created for ${normalizedEmail}; copied to clipboard`);
    } catch (err: any) {
      const detail = err?.errors?.[0]?.message;
      setNotice(detail ? `Share failed: ${detail}` : `Share failed: ${err?.message || 'Could not share with this user'}`);
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
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setNotice('Public link copied to clipboard');
    } catch {
      setNotice('Share created. Copy the link from Generated links.');
    }
  };

  const handleFavorite = async (file: { id: string; name: string }) => {
    setActionBusy(`favorite:${file.id}`);
    try {
      setMenuOpenId(null);
      await toggleFavorite(file.id);
      await loadFiles(parentId || undefined);
      setNotice(`${file.name} updated`);
    } catch (err: any) {
      setNotice(err?.message || 'Could not update favorite');
    } finally {
      setActionBusy(null);
    }
  };

  const handleDelete = async (file: { id: string; name: string }) => {
    setActionBusy(`delete:${file.id}`);
    try {
      setMenuOpenId(null);
      await deleteFile(file.id);
      await loadFiles(parentId || undefined);
      setNotice(`${file.name} moved to trash`);
    } catch (err: any) {
      setNotice(err?.message || 'Delete failed');
    } finally {
      setActionBusy(null);
    }
  };

  const handleRename = async (file: { id: string; name: string }) => {
    const name = window.prompt('Enter a new file name', file.name)?.trim();
    if (!name || name === file.name) return;
    setActionBusy(`rename:${file.id}`);
    try {
      await renameFile(file.id, name);
      setNotice(`${file.name} renamed`);
    } finally {
      setActionBusy(null);
    }
  };

  const loadAllFolders = async () => {
    setMoveFoldersLoading(true);
    try {
      const collected: any[] = [];
      const visit = async (parentId?: string) => {
        const response = await folderAPI.getList({ parentId }) as any;
        const children = response.folders || [];
        collected.push(...children);
        await Promise.all(children.map((folder: any) => visit(folder.id)));
      };
      await visit();
      setAllFolders(collected);
    } catch {
      setNotice('Could not load folders for moving');
    } finally {
      setMoveFoldersLoading(false);
    }
  };

  const handleMove = async (file: { id: string; name: string }) => {
    setMoveItem({ ...file, type: 'file' });
    setMoveDestination('');
    void loadAllFolders();
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setActionBusy('create-folder');
    try {
      await createFolder(name, parentId || undefined);
      setNewFolderName('');
      setIsCreatingFolder(false);
      setNotice(`${name} folder created`);
    } finally {
      setActionBusy(null);
    }
  };

  const openFolder = (folderId: string) => router.push(`/dashboard?parentId=${folderId}`);

  const handleMoveFolder = (folder: { id: string; name: string }) => {
    setMoveItem({ ...folder, type: 'folder' });
    setMoveDestination('');
    void loadAllFolders();
  };

  const confirmMove = async () => {
    if (!moveItem) return;
    setActionBusy(`move:${moveItem.id}`);
    try {
      if (moveItem.type === 'file') await moveFile(moveItem.id, moveDestination || undefined);
      else await useFileStore.getState().moveFolder(moveItem.id, moveDestination || undefined);
      setMoveItem(null);
      await loadFiles(parentId || undefined, searchQuery);
      await loadFolders(parentId || undefined);
      setNotice(`${moveItem.name} moved successfully`);
    } finally {
      setActionBusy(null);
    }
  };

  const handleDeleteFolder = async (folder: { id: string; name: string }) => {
    if (!window.confirm(`Move ${folder.name} to Trash?`)) return;
    await useFileStore.getState().deleteFolder(folder.id);
    await loadFolders(parentId || undefined);
    setNotice(`${folder.name} moved to Trash`);
  };

  const handleRenameFolder = async (folder: { id: string; name: string }) => {
    const name = window.prompt('Enter a new folder name', folder.name)?.trim();
    if (!name || name === folder.name) return;
    await useFileStore.getState().renameFolder(folder.id, name);
    await loadFolders(parentId || undefined);
    setNotice(`${folder.name} renamed`);
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

  const visibleFiles = files
    .filter((file) => typeFilter === 'all' || file.mimeType.startsWith(`${typeFilter}/`))
    .filter((file) => ownerFilter === 'all' || file.ownerId === user?.id)
    .sort((first, second) => sortBy === 'name' ? first.name.localeCompare(second.name) : sortBy === 'size' ? Number(second.size) - Number(first.size) : new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());

  return (
    <main className="min-h-full bg-[#020817] p-6">
      <div className="flex items-center justify-between border-b border-cyan-500/15 pb-5">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">My Files</h2>
          <p className="mt-1 text-sm text-slate-400">
            {visibleFiles.length} {visibleFiles.length === 1 ? 'file' : 'files'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsCreatingFolder(true)} className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 hover:border-cyan-400"><Plus className="h-4 w-4" />New folder</button>
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
        <div className="mt-8">
          {parentId && <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumbs"><button onClick={() => router.push('/dashboard')} className="text-cyan-300 hover:text-cyan-100">My Files</button>{breadcrumbs.map((crumb) => <span key={crumb.id} className="flex items-center gap-1"><ChevronRight className="h-4 w-4 text-slate-600" />{crumb.id === parentId ? <span className="font-semibold text-white">{crumb.name}</span> : <button onClick={() => openFolder(crumb.id)} className="text-cyan-300 hover:text-cyan-100">{crumb.name}</button>}</span>)}</nav>}
          {folders.length > 0 && <section className="mb-6"><div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400"><FolderOpen className="h-4 w-4" />Folders</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{folders.map((folder) => <div key={folder.id} className="group relative rounded-2xl border border-cyan-500/20 bg-linear-to-br from-[#0b1220] to-[#0a1425] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/60 hover:shadow-[0_14px_35px_rgba(34,211,238,0.1)]"><button onClick={() => openFolder(folder.id)} className="flex w-full min-w-0 items-center gap-4 text-left"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300"><FolderOpen className="h-6 w-6" /></span><span className="min-w-0"><span className="block truncate font-bold text-white">{folder.name}</span><span className="mt-1 block text-xs text-slate-400">{folder._count?.files || 0} files · Open folder</span></span></button><div className="mt-5 flex items-center justify-between border-t border-cyan-500/10 pt-3"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Folder actions</span><div className="relative"><button onClick={() => setFolderMenuId((current) => current === folder.id ? null : folder.id)} aria-label={`Folder actions for ${folder.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-200"><MoreVertical className="h-4 w-4" /></button>{folderMenuId === folder.id && <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl border border-cyan-500/20 bg-[#07101f] p-1 shadow-2xl"><button onClick={() => handleShare({ id: folder.id, name: folder.name, itemType: 'folder' })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10"><Share2 className="h-4 w-4" />Share</button><button onClick={() => handleMoveFolder(folder)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10"><FolderInput className="h-4 w-4" />Move</button><button onClick={() => handleRenameFolder(folder)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10"><PencilLine className="h-4 w-4" />Rename</button><button onClick={() => handleDeleteFolder(folder)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" />Delete</button></div>}</div><ChevronRight className="h-4 w-4 text-slate-500" /></div></div>)}</div></section>}
          <div onDragOver={(event) => event.preventDefault()} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`mb-6 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-8 text-center transition ${isDragging ? 'border-cyan-300 bg-cyan-400/10' : 'border-cyan-500/25 bg-[#0b1220]/70 hover:border-cyan-400/60'} ${isUploading ? 'cursor-wait opacity-60' : ''}`}>
            <FileUp className="h-8 w-8 text-cyan-400" />
            <p className="mt-3 font-semibold text-white">{isUploading ? 'Uploading files...' : isDragging ? 'Drop files to upload' : 'Drag and drop files here'}</p>
            <p className="mt-1 text-sm text-slate-400">or click to browse from your device</p>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-500/15 bg-[#0b1220]/70 p-3"><Filter className="ml-1 h-4 w-4 text-cyan-300" /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-lg border border-cyan-500/20 bg-[#0f172a] px-3 py-2 text-sm text-slate-200"><option value="all">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="audio">Audio</option><option value="application">Documents</option></select><select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className="rounded-lg border border-cyan-500/20 bg-[#0f172a] px-3 py-2 text-sm text-slate-200"><option value="all">All owners</option><option value="mine">My files</option></select><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-cyan-500/20 bg-[#0f172a] px-3 py-2 text-sm text-slate-200"><option value="newest">Newest first</option><option value="name">Name A-Z</option><option value="size">Largest first</option></select></div>

          <div className="grid gap-4 md:grid-cols-2">
            {visibleFiles.map((file) => (
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
                        <button onClick={() => void handleDownload(file)} disabled={actionBusy === `download:${file.id}`} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50">
                          {actionBusy === `download:${file.id}` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          Download
                        </button>
                        <button onClick={() => handleShare(file)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10">
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                        <button onClick={() => handleRename(file)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10"><PencilLine className="h-4 w-4" />Rename</button>
                        <button onClick={() => handleMove(file)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10"><FolderInput className="h-4 w-4" />Move to My Files</button>
                        <button onClick={() => void handleFavorite(file)} disabled={actionBusy === `favorite:${file.id}`} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50">
                          <Heart className={file.isFavorite ? 'h-4 w-4 fill-rose-400 text-rose-400' : 'h-4 w-4'} />
                          {file.isFavorite ? 'Unstar' : 'Star'}
                        </button>
                        <button onClick={() => void handleDelete(file)} disabled={actionBusy === `delete:${file.id}`} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                          {actionBusy === `delete:${file.id}` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

      {!isLoading && !error && visibleFiles.length === 0 && (
        <div className="mt-8 rounded-[28px] border border-dashed border-cyan-500/25 bg-[#0b1220]/60 p-10 text-center">
          <div className="mb-4 flex justify-center text-5xl">↥</div>
          <h3 className="text-2xl font-black text-white">No files yet</h3>
          <p className="mt-2 text-slate-400">Drop files above or use Upload to get started.</p>
        </div>
      )}

      {isCreatingFolder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-cyan-500/25 bg-[#07101f] p-6"><h3 className="text-xl font-black text-white">Create folder</h3><input autoFocus value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void handleCreateFolder()} placeholder="Folder name" className="mt-4 w-full rounded-xl border border-cyan-500/20 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-cyan-400" /><div className="mt-5 flex gap-3"><button onClick={() => void handleCreateFolder()} className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950">Create</button><button onClick={() => setIsCreatingFolder(false)} className="flex-1 rounded-xl border border-cyan-500/20 px-4 py-3 text-cyan-200">Cancel</button></div></div></div>}

      {shareFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-cyan-500/25 bg-[#07101f] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Sharing</p><h3 className="mt-1 text-2xl font-black text-white">{shareFile.name}</h3></div>
              <button onClick={() => setShareFile(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close sharing dialog"><X className="h-5 w-5" /></button>
            </div>
            {shareLoading && <p className="mt-5 text-sm text-cyan-300">Updating sharing settings...</p>}

            <section className="mt-6 border-t border-cyan-500/15 pt-5">
              <div className="mb-3 flex items-center gap-2 text-white"><UserPlus className="h-4 w-4 text-cyan-300" /><h4 className="font-bold">Share link with anyone</h4></div>
              <p className="mb-3 text-sm text-slate-400">The recipient does not need an AetherCloud account. Send the generated link to any email address.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="person@example.com" className="min-w-0 rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 sm:col-span-2" />
                <select value={sharePermission} onChange={(e) => setSharePermission(e.target.value as 'VIEWER' | 'EDITOR')} className="min-w-0 rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-3 text-sm text-white outline-none"><option value="VIEWER">Viewer access</option><option value="EDITOR">Editor access</option></select>
                <input type="datetime-local" value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)} className="min-w-0 rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-3 text-sm text-white outline-none" aria-label="Optional link expiry" />
                <input type="password" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} placeholder="Optional password" className="min-w-0 flex-1 rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-2.5 text-sm text-white outline-none" />
                <button onClick={addUserShare} disabled={shareLoading || !shareEmail.trim()} className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50">Share and copy link</button>
              </div>
              <div className="mt-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">People with access</p><div className="space-y-2">{shares.length ? shares.map((share) => <div key={share.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/10 bg-[#0f172a] px-3 py-3 text-sm"><span className="min-w-0 truncate text-slate-200">{share.sharedWith?.name || share.sharedWith?.email}</span><span className="flex items-center gap-3 text-slate-400">{share.permission === 'EDITOR' ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{share.permission}<button onClick={() => void revokeUserShare(share.id)} className="rounded-lg border border-red-400/20 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/10">Revoke access</button></span></div>) : <p className="rounded-xl bg-[#0f172a] px-3 py-3 text-sm text-slate-500">Only you have access right now.</p>}</div></div>
            </section>

            <section className="mt-6 border-t border-cyan-500/15 pt-5">
              <div className="mb-3 flex items-center gap-2 text-white"><Link2 className="h-4 w-4 text-cyan-300" /><h4 className="font-bold">Generated link</h4><span className="text-xs text-slate-500">Created after Share</span></div>
              <div className="mt-3 space-y-2">{publicLinks.filter((link) => newLinkIds.includes(link.id)).map((link) => <div key={link.id} className="rounded-xl border border-cyan-500/10 bg-[#0f172a] px-3 py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-slate-300">{link.expiresAt ? `Expires ${formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}` : 'Never expires'}{link.password ? ' · Password protected' : ''}</span><span className="flex items-center gap-2"><button onClick={() => void copyLink(link.publicUrl)} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 px-2.5 py-1 text-xs text-cyan-200 hover:bg-cyan-500/10"><Copy className="h-3.5 w-3.5" />Copy link</button><button onClick={() => void revokeLink(link.id)} className="rounded-lg border border-red-400/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10">Revoke link</button></span></div><p className="mt-2 truncate text-xs text-slate-500">{link.publicUrl}</p></div>)}{!newLinkIds.length && <p className="rounded-xl bg-[#0f172a] px-3 py-3 text-sm text-slate-500">No link generated in this share yet.</p>}</div>
              <details className="mt-4 rounded-xl border border-cyan-500/10 bg-[#0f172a] px-3 py-3"><summary className="cursor-pointer text-sm font-medium text-slate-400">Existing active links ({publicLinks.filter((link) => !newLinkIds.includes(link.id)).length})</summary><div className="mt-3 space-y-2">{publicLinks.filter((link) => !newLinkIds.includes(link.id)).map((link) => <div key={link.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="truncate text-slate-500">{link.publicUrl}</span><span className="flex gap-2"><button onClick={() => void copyLink(link.publicUrl)} className="text-cyan-300">Copy</button><button onClick={() => void revokeLink(link.id)} className="text-red-300">Revoke</button></span></div>)}</div></details>
            </section>
          </div>
        </div>
      )}

      {moveItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-cyan-500/25 bg-[#07101f] p-6"><h3 className="text-xl font-black text-white">Move {moveItem.type}</h3><p className="mt-2 truncate text-sm text-slate-400">{moveItem.name}</p><label className="mt-5 block text-sm text-slate-300">Destination folder</label><select value={moveDestination} onChange={(event) => setMoveDestination(event.target.value)} disabled={moveFoldersLoading || actionBusy?.startsWith('move:')} className="mt-2 w-full rounded-xl border border-cyan-500/20 bg-[#0f172a] px-3 py-3 text-white disabled:opacity-60"><option value="">My Files (root)</option>{allFolders.filter((folder) => folder.id !== moveItem.id).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>{moveFoldersLoading && <p className="mt-2 flex items-center gap-2 text-xs text-cyan-300"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Loading all folders...</p>}<div className="mt-5 flex gap-3"><button onClick={() => void confirmMove()} disabled={moveFoldersLoading || actionBusy?.startsWith('move:')} className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{actionBusy?.startsWith('move:') ? <LoaderCircle className="mx-auto h-5 w-5 animate-spin" /> : 'Move here'}</button><button onClick={() => setMoveItem(null)} disabled={actionBusy?.startsWith('move:')} className="flex-1 rounded-xl border border-cyan-500/20 px-4 py-3 text-cyan-200 disabled:opacity-50">Cancel</button></div></div></div>}
    </main>
  );
}
