import { AppError, asyncHandler } from '../utils/errors.js';
import prisma from '../config/database.js';

export const searchItems = asyncHandler(async (req, res, next) => {
  const { query, type = 'all', sortBy = 'name', sortOrder = 'asc' } = req.validatedQuery;
  const userId = req.user.id;

  if (!query || query.trim().length === 0) {
    throw new AppError('Search query is required', 400);
  }

  const searchQuery = {
    ownerId: userId,
    name: {
      contains: query,
      mode: 'insensitive',
    },
  };

  const sortOptions = {
    name: { name: sortOrder === 'asc' ? 'asc' : 'desc' },
    date: { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' },
    size: { size: sortOrder === 'asc' ? 'asc' : 'desc' },
  };

  const results = {
    files: [],
    folders: [],
  };

  // Search files
  if (type === 'all' || type === 'file') {
    const files = await prisma.file.findMany({
      where: searchQuery,
      include: {
        owner: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
      orderBy: sortOptions[sortBy] || sortOptions.name,
      take: 50,
    });

    results.files = files;
  }

  // Search folders
  if (type === 'all' || type === 'folder') {
    const folders = await prisma.folder.findMany({
      where: searchQuery,
      include: {
        owner: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
        _count: {
          select: { files: true, children: true },
        },
      },
      orderBy: sortOptions[sortBy] || sortOptions.name,
      take: 50,
    });

    results.folders = folders;
  }

  res.status(200).json({
    success: true,
    results,
    total: results.files.length + results.folders.length,
  });
});

export const getSharedWithMe = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Get files shared with me
  const sharedFiles = await prisma.file.findMany({
    where: {
      shares: {
        some: { sharedWithId: userId },
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        where: { sharedWithId: userId },
        select: { permission: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get folders shared with me
  const sharedFolders = await prisma.folder.findMany({
    where: {
      shares: {
        some: { sharedWithId: userId },
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        where: { sharedWithId: userId },
        select: { permission: true },
      },
      _count: {
        select: { files: true, children: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    files: sharedFiles,
    folders: sharedFolders,
  });
});
