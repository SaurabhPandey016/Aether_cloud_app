'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFileStore } from '@/lib/stores/fileStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { Plus, Upload, FolderOpen, MoreVertical, Download, Share2, Heart, Folder, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FileExplorer() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId');
  const { files, folders, isLoading, error, loadFolders, loadFiles, createFolder } = useFileStore();
  const { user } = useAuthStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    if (user) {
      loadFolders(parentId || undefined);
      loadFiles(parentId || undefined);
    }
  }, [user, parentId, loadFolders, loadFiles]);

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
                  <input type="file" className="hidden" />
                </label>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/20 bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-cyan-200">
            <Upload className="h-4 w-4" />
            Upload
            <input type="file" className="hidden" />
          </label>
        </div>
      </div>

      {isCreatingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-105 rounded-[26px] border border-cyan-500/20 bg-[#020817] p-6 shadow-[0_24px_80px_rgba(34,211,238,0.14)]">
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

      {isLoading && (
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            <p className="mt-4 text-slate-300">Loading files...</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="mt-8 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-200">{error}</div>
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

                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-300">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-cyan-500/15 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Download className="h-3.5 w-3.5" />
                    <Share2 className="h-3.5 w-3.5" />
                    <Heart className="h-3.5 w-3.5" />
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
    </main>
  );
}
