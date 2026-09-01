import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
export const STORAGE_BUCKET = 'files';

if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export const ensureStoragePath = (relativePath) => {
  const fullPath = path.join(STORAGE_ROOT, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  return fullPath;
};

export const getStoragePath = (userId, folderId, filename) => {
  return path.join(userId, folderId || 'root', filename).replace(/\\/g, '/');
};

export const getPublicFileUrl = (storagePath) => {
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath.replace(/\\/g, '/')}`;
  }
  return `${process.env.CLIENT_URL || 'http://localhost:3000'}/uploads/${storagePath.replace(/\\/g, '/')}`;
};

export const writeFileToStorage = async (storagePath, fileBuffer, contentType = 'application/octet-stream') => {
  try {
    // Always write to local filesystem
    const fullPath = ensureStoragePath(storagePath);
    fs.writeFileSync(fullPath, fileBuffer);

    // Also try to upload to Supabase if configured, but don't fail if it errors
    if (supabase && supabaseUrl && supabaseKey) {
      try {
        const result = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, fileBuffer, {
          contentType,
          upsert: true,
        });
        if (result.error) {
          console.warn('Supabase upload warning:', result.error);
        }
      } catch (supabaseError) {
        console.warn('Supabase upload failed (using local storage):', supabaseError.message);
      }
    }

    return { data: { path: fullPath }, error: null };
  } catch (error) {
    return { data: null, error: error.message || 'File storage failed' };
  }
};

export const removeFileFromStorage = async (storagePath) => {
  try {
    // Always remove from local filesystem
    const fullPath = path.join(STORAGE_ROOT, storagePath.replace(/\\/g, '/'));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Also try to remove from Supabase if configured, but don't fail if it errors
    if (supabase && supabaseUrl && supabaseKey) {
      try {
        const result = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
        if (result.error) {
          console.warn('Supabase removal warning:', result.error);
        }
      } catch (supabaseError) {
        console.warn('Supabase removal failed (using local storage):', supabaseError.message);
      }
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error.message || 'File removal failed' };
  }
};
