import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  },
);

type AuthPayload = { email: string; password: string; name?: string };
type FolderPayload = { name?: string; parentId?: string | null };
type FilePayload = { name?: string; folderId?: string | null };
type SharePayload = {
  itemId: string;
  itemType: 'file' | 'folder';
  sharedWithEmail?: string;
  permission?: 'VIEWER' | 'EDITOR';
  expiresAt?: string;
  password?: string;
};

type RequestParams = Record<string, string | number | boolean | null | undefined>;

// Auth APIs
export const authAPI = {
  signup: (data: AuthPayload) => apiClient.post<{ user: { id: string; email: string; name: string } }>('/auth/signup', data),
  login: (data: AuthPayload) => apiClient.post<{ user: { id: string; email: string; name: string } }>('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get<{ user: { id: string; email: string; name: string } }>('/auth/me'),
  updateProfile: (data: Partial<AuthPayload>) => apiClient.put('/auth/profile', data),
};

// Folder APIs
export const folderAPI = {
  create: (data: FolderPayload) => apiClient.post('/folders', data),
  getList: (params: RequestParams = {}) => apiClient.get<{ folders: Array<{ id: string; name: string; createdAt: string; _count?: { files: number } }> }>('/folders', { params }),
  getDetails: (folderId: string) => apiClient.get(`/folders/${folderId}`),
  rename: (folderId: string, data: FolderPayload) => apiClient.put(`/folders/${folderId}`, data),
  move: (folderId: string, data: FolderPayload) => apiClient.patch(`/folders/${folderId}/move`, data),
  delete: (folderId: string) => apiClient.delete(`/folders/${folderId}`),
  getBreadcrumbs: (folderId: string) => apiClient.get(`/folders/${folderId}/breadcrumbs`),
};

// File APIs
export const fileAPI = {
  upload: (formData: FormData) => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    return apiClient.post('/files/upload', formData, config);
  },
  getList: (params: RequestParams = {}) => apiClient.get<{ files: Array<{ id: string; name: string; mimeType: string; size: number | bigint; createdAt: string; isFavorite?: boolean }> }>('/files', { params }),
  download: async (fileId: string) => {
    const response = await apiClient.get(`/files/${fileId}/download`, { responseType: 'blob' });
    return response as unknown as Blob;
  },
  rename: (fileId: string, data: FilePayload) => apiClient.put(`/files/${fileId}`, data),
  move: (fileId: string, data: FilePayload) => apiClient.patch(`/files/${fileId}/move`, data),
  delete: (fileId: string) => apiClient.delete(`/files/${fileId}`),
  toggleFavorite: (fileId: string) => apiClient.patch(`/files/${fileId}/favorite`),
  getFavorites: () => apiClient.get('/files/favorites'),
  getRecent: (params: RequestParams = {}) => apiClient.get('/files/recent', { params }),
};

// Share APIs
export const shareAPI = {
  shareWithUser: (data: SharePayload) => apiClient.post('/shares/user', data),
  revokeShare: (shareId: string) => apiClient.delete(`/shares/${shareId}`),
  getShares: (itemType: string, itemId: string) => apiClient.get(`/shares/${itemType}/${itemId}`),
  createPublicLink: (data: SharePayload) => apiClient.post('/shares/link', data),
  getPublicLinks: (itemType: string, itemId: string) => apiClient.get(`/shares/links/${itemType}/${itemId}`),
  revokePublicLink: (linkId: string) => apiClient.delete(`/shares/link/${linkId}`),
  accessPublicLink: (token: string, password: string) =>
    apiClient.post(`/shares/public-link/${token}/access`, { password }),
};

// Trash APIs
export const trashAPI = {
  getList: () => apiClient.get('/trash'),
  restore: (trashId: string) => apiClient.post(`/trash/${trashId}/restore`),
  empty: () => apiClient.delete('/trash'),
  permanentDelete: (trashId: string) => apiClient.delete(`/trash/${trashId}`),
};

// Search APIs
export const searchAPI = {
  search: (params: RequestParams = {}) => apiClient.get('/search', { params }),
  getSharedWithMe: () => apiClient.get('/search/shared/with-me'),
};
