import { AppError, asyncHandler } from '../utils/errors.js';
import prisma from '../config/database.js';

// Helper function to convert BigInt to string for JSON serialization
const serializeFile = (file) => {
  if (!file || !file.size) return file;
  return {
    ...file,
    size: file.size.toString(),
    fileData: undefined, // Don't send file binary data in responses (only metadata)
  };
};

const serializeFiles = (files) => {
  if (!Array.isArray(files)) return files;
  return files.map(serializeFile);
};

/**
 * Upload file - Store file binary data directly in PostgreSQL via Prisma
 * POST /api/files/upload
 * Body: FormData with 'file' field and 'folderId' field
 */
export const uploadFile = async (req, res, next) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const userId = req.user.id;
    const { folderId } = req.body;
    const { originalname, mimetype, buffer, size } = req.file;

    // Validate file size (100MB max)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 104857600;
    if (size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
      });
    }

    // Validate folder if provided
    let targetFolderId = null;
    if (folderId && folderId !== 'null' && folderId !== '') {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found',
        });
      }

      const editorShare = await prisma.share.findFirst({ where: { folderId, sharedWithId: userId, permission: 'EDITOR' } });
      if (folder.ownerId !== userId && !editorShare) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this folder',
        });
      }

      targetFolderId = folderId;
    }

    // Create file record in database
    const file = await prisma.file.create({
      data: {
        name: originalname,
        mimeType: mimetype,
        size: BigInt(size),
        fileData: buffer,
        fileKey: null,
        ownerId: userId,
        folderId: targetFolderId,
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: serializeFile(file),
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get files in a folder
 * GET /api/files?folderId=xyz&search=query
 */
export const getFiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { folderId, search } = req.query;

  const folderAccess = folderId ? await prisma.folder.findFirst({
    where: { id: folderId, OR: [{ ownerId: userId }, { shares: { some: { sharedWithId: userId } } }] },
    select: { id: true },
  }) : null;

  const files = await prisma.file.findMany({
    where: {
      deletedAt: null,
      folderId: folderId || null,
      ...(folderId && folderAccess ? {} : { ownerId: userId }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    },
    select: {
      id: true,
      name: true,
      mimeType: true,
      size: true,
      folderId: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true } },
      favoriteBy: { where: { id: userId }, select: { id: true } },
      // Exclude fileData from query for better performance
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    files: files.map((file) => ({ ...serializeFile(file), isFavorite: file.favoriteBy.length > 0 })),
  });
});

/**
 * Download file - Retrieve file binary data from database and send
 * GET /api/files/:fileId/download
 */
export const downloadFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user.id;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      shares: { 
        where: { sharedWithId: userId },
        select: { permission: true },
      },
    },
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  // Check access: owner or shared with VIEWER/EDITOR permission
  const isOwner = file.ownerId === userId;
  const hasAccess = isOwner || (file.shares && file.shares.length > 0);

  if (!hasAccess) {
    throw new AppError('Access denied', 403);
  }

  if (!file.fileData) {
    throw new AppError('File data not available', 404);
  }

  // Send file as attachment
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.setHeader('Content-Length', file.size.toString());

  res.send(file.fileData);
});

/**
 * Rename file
 * PUT /api/files/:fileId
 */
export const renameFile = asyncHandler(async (req, res, next) => {
  const { fileId } = req.params;
  const { name } = req.validatedData;
  const userId = req.user.id;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      shares: { where: { sharedWithId: userId } },
    },
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  // Check access
  if (file.ownerId !== userId) {
    const share = file.shares.find((s) => s.sharedWithId === userId && s.permission === 'EDITOR');
    if (!share) {
      throw new AppError('You do not have permission to rename this file', 403);
    }
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: { name },
    include: {
      owner: { select: { id: true, name: true } },
    },
  });

  res.status(200).json({
    success: true,
    message: 'File renamed successfully',
    file: serializeFile(updatedFile),
  });
});


/**
 * Move file to another folder
 * PATCH /api/files/:fileId/move
 */
export const moveFile = asyncHandler(async (req, res, next) => {
  const { fileId } = req.params;
  const { folderId } = req.validatedData;
  const userId = req.user.id;

  const file = await prisma.file.findUnique({ where: { id: fileId }, include: { shares: { where: { sharedWithId: userId }, select: { permission: true } } } });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  if (file.ownerId !== userId && !file.shares.some((share) => share.permission === 'EDITOR')) {
    throw new AppError('You do not have permission to move this file', 403);
  }

  // Verify target folder exists
  if (folderId) {
    const targetFolder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!targetFolder || (targetFolder.ownerId !== userId && !await prisma.share.findFirst({ where: { folderId, sharedWithId: userId, permission: 'EDITOR' } }))) {
      throw new AppError('Invalid folder', 400);
    }
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: { folderId: folderId || null },
    include: {
      owner: { select: { id: true, name: true } },
    },
  });

  res.status(200).json({
    success: true,
    message: 'File moved successfully',
    file: serializeFile(updatedFile),
  });
});

/**
 * Delete file (move to trash)
 * DELETE /api/files/:fileId
 */
export const deleteFile = asyncHandler(async (req, res, next) => {
  const { fileId } = req.params;
  const userId = req.user.id;

  const file = await prisma.file.findUnique({ where: { id: fileId }, include: { shares: { where: { sharedWithId: userId }, select: { permission: true } } } });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  if (file.ownerId !== userId && !file.shares.some((share) => share.permission === 'EDITOR')) {
    throw new AppError('You do not have permission to delete this file', 403);
  }

  // Move to trash (keep file in database, just mark it as trashed)
  const trash = await prisma.trash.create({
    data: {
      ownerId: file.ownerId,
      fileId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });

  res.status(200).json({
    success: true,
    message: 'File moved to trash',
    trash,
  });
});

/**
 * Toggle favorite status
 * PATCH /api/files/:fileId/favorite
 */
export const toggleFavorite = asyncHandler(async (req, res, next) => {
  const { fileId } = req.params;
  const userId = req.user.id;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      favoriteBy: { where: { id: userId } },
    },
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  if (file.ownerId !== userId) {
    throw new AppError('You cannot favorite this file', 403);
  }

  const isFavorite = file.favoriteBy.length > 0;

  if (isFavorite) {
    await prisma.file.update({
      where: { id: fileId },
      data: {
        favoriteBy: { disconnect: { id: userId } },
      },
    });
  } else {
    await prisma.file.update({
      where: { id: fileId },
      data: {
        favoriteBy: { connect: { id: userId } },
      },
    });
  }

  res.status(200).json({
    success: true,
    message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
    isFavorite: !isFavorite,
  });
});

/**
 * Get favorite files
 * GET /api/files/favorites
 */
export const getFavoriteFiles = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const files = await prisma.file.findMany({
    where: {
      deletedAt: null,
      favoriteBy: {
        some: { id: userId },
      },
    },
    select: {
      id: true,
      name: true,
      mimeType: true,
      size: true,
      folderId: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    files: serializeFiles(files),
  });
});

/**
 * Get recent files
 * GET /api/files/recent?limit=10
 */
export const getRecentFiles = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { limit = 10 } = req.query;

  const files = await prisma.file.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      mimeType: true,
      size: true,
      folderId: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: Math.min(parseInt(limit) || 10, 100),
  });

  res.status(200).json({
    success: true,
    files: serializeFiles(files),
  });
});

/** Return actual active storage usage for the authenticated user. */
export const getStorageUsage = asyncHandler(async (req, res) => {
  const result = await prisma.file.aggregate({
    where: { ownerId: req.user.id, deletedAt: null },
    _sum: { size: true },
    _count: { _all: true },
  });
  const quota = BigInt(process.env.STORAGE_QUOTA_BYTES || 100 * 1024 * 1024 * 1024);
  const used = result._sum.size || 0n;

  res.status(200).json({
    success: true,
    storage: { usedBytes: used.toString(), quotaBytes: quota.toString(), fileCount: result._count._all },
  });
});
