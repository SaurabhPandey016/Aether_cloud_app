import { AppError, asyncHandler } from '../utils/errors.js';
import prisma from '../config/database.js';
import { removeFileFromStorage } from '../config/supabase.js';

export const getTrash = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const trash = await prisma.trash.findMany({
    where: { ownerId: userId },
    include: {
      file: { select: { id: true, name: true, mimeType: true, size: true } },
      folder: { select: { id: true, name: true } },
    },
    orderBy: { deletedAt: 'desc' },
  });

  // Serialize BigInt values
  const serializedTrash = trash.map(item => ({
    ...item,
    file: item.file ? { ...item.file, size: item.file.size.toString() } : null,
  }));

  res.status(200).json({
    success: true,
    trash: serializedTrash,
  });
});

export const restoreFromTrash = asyncHandler(async (req, res, next) => {
  const { trashId } = req.params;
  const userId = req.user.id;

  const trash = await prisma.trash.findUnique({
    where: { id: trashId },
  });

  if (!trash) {
    throw new AppError('Trash item not found', 404);
  }

  if (trash.ownerId !== userId) {
    throw new AppError('You do not have permission to restore this item', 403);
  }

  // Restore item
  if (trash.fileId) {
    await prisma.file.update({
      where: { id: trash.fileId },
      data: { deletedAt: null },
    });
  }

  if (trash.folderId) {
    await prisma.folder.update({
      where: { id: trash.folderId },
      data: { deletedAt: null },
    });
  }

  // Remove from trash
  await prisma.trash.delete({
    where: { id: trashId },
  });

  res.status(200).json({
    success: true,
    message: 'Item restored successfully',
  });
});

export const emptyTrash = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Get all trash items
  const trashItems = await prisma.trash.findMany({ where: { ownerId: userId }, include: { file: true } });
  for (const item of trashItems) {
    if (item.file?.fileKey) await removeFileFromStorage(item.file.fileKey);
    await prisma.trash.delete({ where: { id: item.id } });
    if (item.fileId) await prisma.file.delete({ where: { id: item.fileId } });
    if (item.folderId) await prisma.folder.delete({ where: { id: item.folderId } });
  }

  res.status(200).json({
    success: true,
    message: 'Trash emptied successfully',
  });
});

export const permanentlyDeleteItem = asyncHandler(async (req, res, next) => {
  const { trashId } = req.params;
  const userId = req.user.id;

  const trash = await prisma.trash.findUnique({
    where: { id: trashId },
  });

  if (!trash) {
    throw new AppError('Trash item not found', 404);
  }

  if (trash.ownerId !== userId) {
    throw new AppError('You do not have permission to delete this item', 403);
  }

  // Delete from storage if file
  if (trash.fileId) {
    const file = await prisma.file.findUnique({
      where: { id: trash.fileId },
    });

    if (file) {
      if (file.fileKey) await removeFileFromStorage(file.fileKey);
    }
  }

  // Delete trash record
  await prisma.trash.delete({
    where: { id: trashId },
  });

  if (trash.fileId) await prisma.file.delete({ where: { id: trash.fileId } });
  if (trash.folderId) await prisma.folder.delete({ where: { id: trash.folderId } });

  res.status(200).json({
    success: true,
    message: 'Item permanently deleted',
  });
});
