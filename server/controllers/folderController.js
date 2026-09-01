import { AppError, asyncHandler } from '../utils/errors.js';
import prisma from '../config/database.js';

export const createFolder = asyncHandler(async (req, res, next) => {
  const { name, parentId } = req.validatedData;
  const userId = req.user.id;

  // Verify parent folder exists and user has access
  if (parentId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: parentId },
    });

    if (!parentFolder) {
      throw new AppError('Parent folder not found', 404);
    }

    if (parentFolder.ownerId !== userId) {
      throw new AppError('You do not have permission to create folders here', 403);
    }
  }

  const folder = await prisma.folder.create({
    data: {
      name,
      ownerId: userId,
      parentId: parentId || null,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Folder created successfully',
    folder,
  });
});

export const getFolders = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { parentId } = req.query;

  const folders = await prisma.folder.findMany({
    where: {
      ownerId: userId,
      parentId: parentId || null,
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: {
        select: { files: true, children: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    folders,
  });
});

export const getFolderDetails = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;
  const userId = req.user.id;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      owner: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
      children: {
        select: { id: true, name: true, createdAt: true },
      },
      files: {
        select: { id: true, name: true, mimeType: true, size: true, createdAt: true },
      },
      shares: {
        include: { sharedWith: { select: { id: true, email: true, name: true } } },
      },
    },
  });

  if (!folder) {
    throw new AppError('Folder not found', 404);
  }

  // Check access
  if (folder.ownerId !== userId) {
    const share = folder.shares.find((s) => s.sharedWithId === userId);
    if (!share) {
      throw new AppError('Access denied', 403);
    }
  }

  res.status(200).json({
    success: true,
    folder,
  });
});

export const renameFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;
  const { name } = req.validatedData;
  const userId = req.user.id;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder) {
    throw new AppError('Folder not found', 404);
  }

  if (folder.ownerId !== userId) {
    throw new AppError('You do not have permission to rename this folder', 403);
  }

  const updatedFolder = await prisma.folder.update({
    where: { id: folderId },
    data: { name },
    include: {
      owner: { select: { id: true, name: true } },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Folder renamed successfully',
    folder: updatedFolder,
  });
});

export const moveFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;
  const { parentId } = req.validatedData;
  const userId = req.user.id;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder) {
    throw new AppError('Folder not found', 404);
  }

  if (folder.ownerId !== userId) {
    throw new AppError('You do not have permission to move this folder', 403);
  }

  // Prevent circular reference
  if (parentId === folderId) {
    throw new AppError('Cannot move a folder into itself', 400);
  }

  // Verify parent folder exists
  if (parentId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: parentId },
    });

    if (!parentFolder || parentFolder.ownerId !== userId) {
      throw new AppError('Invalid parent folder', 400);
    }
  }

  const updatedFolder = await prisma.folder.update({
    where: { id: folderId },
    data: { parentId: parentId || null },
    include: {
      owner: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Folder moved successfully',
    folder: updatedFolder,
  });
});

export const deleteFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;
  const userId = req.user.id;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder) {
    throw new AppError('Folder not found', 404);
  }

  if (folder.ownerId !== userId) {
    throw new AppError('You do not have permission to delete this folder', 403);
  }

  // Move to trash instead of hard delete
  const files = await prisma.file.findMany({
    where: { folderId },
  });

  await Promise.all([
    // Move files to trash
    ...files.map((file) =>
      prisma.trash.create({
        data: {
          ownerId: userId,
          fileId: file.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ),
    // Move folder to trash
    prisma.trash.create({
      data: {
        ownerId: userId,
        folderId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Delete folder and capture the deleted folder data
  const deletedFolder = await prisma.folder.delete({
    where: { id: folderId },
  });

  res.status(200).json({
    success: true,
    message: 'Folder deleted and moved to trash',
    folder: deletedFolder,
  });
});

export const getBreadcrumbs = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;

  const breadcrumbs = [];
  let currentFolder = folderId;

  while (currentFolder) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolder },
      select: { id: true, name: true, parentId: true },
    });

    if (!folder) break;

    breadcrumbs.unshift({
      id: folder.id,
      name: folder.name,
    });

    currentFolder = folder.parentId;
  }

  res.status(200).json({
    success: true,
    breadcrumbs,
  });
});
