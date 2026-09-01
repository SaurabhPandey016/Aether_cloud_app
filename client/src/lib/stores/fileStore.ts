import { create } from 'zustand';
import { fileAPI, folderAPI } from '@/lib/api';

export interface StoredFile {
  id: string;
  name: string;
  mimeType: string;
  size: bigint;
  ownerId: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  ownerId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
    children: number;
  };
}

interface FileStore {
  files: StoredFile[];
  folders: Folder[];
  currentFolder: Folder | null;
  isLoading: boolean;
  error: string | null;
  selectedItems: Set<string>;
  
  setCurrentFolder: (folder: Folder | null) => void;
  loadFolders: (parentId?: string) => Promise<void>;
  loadFiles: (folderId?: string) => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveFolder: (folderId: string, parentId?: string) => Promise<void>;
  
  uploadFile: (file: File, folderId?: string) => Promise<void>;
  renameFile: (fileId: string, name: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  moveFile: (fileId: string, folderId?: string) => Promise<void>;
  toggleFavorite: (fileId: string) => Promise<void>;
  
  toggleSelectItem: (itemId: string) => void;
  clearSelection: () => void;
  clearError: () => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  folders: [],
  currentFolder: null,
  isLoading: false,
  error: null,
  selectedItems: new Set(),

  setCurrentFolder: (folder) => set({ currentFolder: folder }),

  loadFolders: async (parentId) => {
    set({ isLoading: true, error: null });
    try {
      const response = (await folderAPI.getList({ parentId })) as unknown as { folders: Folder[] };
      set({ folders: response.folders, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load folders', isLoading: false });
    }
  },

  loadFiles: async (folderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = (await fileAPI.getList({ folderId })) as unknown as { files: StoredFile[] };
      set({ files: response.files, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load files', isLoading: false });
    }
  },

  createFolder: async (name, parentId) => {
    set({ isLoading: true, error: null });
    try {
      await folderAPI.create({ name, parentId });
      const response = (await folderAPI.getList({ parentId })) as unknown as { folders: Folder[] };
      set({ folders: response.folders, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to create folder', isLoading: false });
      throw error;
    }
  },

  renameFolder: async (folderId, name) => {
    set({ isLoading: true, error: null });
    try {
      await folderAPI.rename(folderId, { name });
      const state = get();
      const updated = state.folders.map((f) =>
        f.id === folderId ? { ...f, name } : f,
      );
      set({ folders: updated, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to rename folder', isLoading: false });
    }
  },

  deleteFolder: async (folderId) => {
    set({ isLoading: true, error: null });
    try {
      await folderAPI.delete(folderId);
      const state = get();
      set({ folders: state.folders.filter((f) => f.id !== folderId), isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete folder', isLoading: false });
    }
  },

  moveFolder: async (folderId, parentId) => {
    set({ isLoading: true, error: null });
    try {
      await folderAPI.move(folderId, { parentId });
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to move folder', isLoading: false });
    }
  },

  uploadFile: async (file, folderId) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folderId', folderId);

      await fileAPI.upload(formData);
      const response = (await fileAPI.getList({ folderId })) as unknown as { files: StoredFile[] };
      set({ files: response.files, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to upload file', isLoading: false });
      throw error;
    }
  },

  renameFile: async (fileId, name) => {
    set({ isLoading: true, error: null });
    try {
      await fileAPI.rename(fileId, { name });
      const state = get();
      const updated = state.files.map((f) =>
        f.id === fileId ? { ...f, name } : f,
      );
      set({ files: updated, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to rename file', isLoading: false });
    }
  },

  deleteFile: async (fileId) => {
    set({ isLoading: true, error: null });
    try {
      await fileAPI.delete(fileId);
      const state = get();
      set({ files: state.files.filter((f) => f.id !== fileId), isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete file', isLoading: false });
    }
  },

  moveFile: async (fileId, folderId) => {
    set({ isLoading: true, error: null });
    try {
      await fileAPI.move(fileId, { folderId });
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to move file', isLoading: false });
    }
  },

  toggleFavorite: async (fileId) => {
    try {
      await fileAPI.toggleFavorite(fileId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to toggle favorite', isLoading: false });
    }
  },

  toggleSelectItem: (itemId) => {
    const state = get();
    const newSelection = new Set(state.selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    set({ selectedItems: newSelection });
  },

  clearSelection: () => set({ selectedItems: new Set() }),
  clearError: () => set({ error: null }),
}));
