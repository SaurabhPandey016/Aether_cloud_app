import { z } from 'zod';

// Auth validation schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Folder validation schemas
export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255),
  parentId: z.string().nullable().optional(),
});

export const renameFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255),
});

export const moveFolderSchema = z.object({
  parentId: z.string().nullable().optional(),
});

// File validation schemas
export const renameFileSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255),
});

export const moveFileSchema = z.object({
  folderId: z.string().nullable().optional(),
});

const optionalExpirySchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}, z.string().datetime().optional());

// Share validation schemas
export const createShareSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(['file', 'folder']),
  sharedWithEmail: z.string().trim().email().transform((email) => email.toLowerCase()),
  permission: z.enum(['VIEWER', 'EDITOR']),
});

export const createPublicLinkSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(['file', 'folder']),
  recipientEmail: z.string().trim().email().optional(),
  expiresAt: optionalExpirySchema,
  password: z.string().optional(),
  permission: z.enum(['VIEWER', 'EDITOR']).optional(),
});

export const shareWithLinkSchema = createShareSchema.extend({
  expiresAt: optionalExpirySchema,
  password: z.string().optional(),
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1),
  type: z.enum(['all', 'file', 'folder']).optional(),
  sortBy: z.enum(['name', 'date', 'size']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
