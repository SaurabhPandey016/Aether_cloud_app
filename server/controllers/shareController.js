import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors.js';
import prisma from '../config/database.js';

export const shareWithUser = asyncHandler(async (req, res, next) => {
  const { itemId, itemType, sharedWithEmail, permission } = req.validatedData;
  const userId = req.user.id;

  // Find the user to share with
  const sharedWithUser = await prisma.user.findUnique({
    where: { email: sharedWithEmail },
  });

  if (!sharedWithUser) {
    throw new AppError('User not found', 404);
  }

  if (sharedWithUser.id === userId) {
    throw new AppError('Cannot share with yourself', 400);
  }

  // Verify ownership
  const model = itemType === 'file' ? prisma.file : prisma.folder;
  const item = await model.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (item.ownerId !== userId) {
    throw new AppError('You do not have permission to share this item', 403);
  }

  // Create or update share
  const share = await prisma.share.upsert({
    where: {
      ...(itemType === 'file'
        ? { fileId_sharedWithId: { fileId: itemId, sharedWithId: sharedWithUser.id } }
        : { folderId_sharedWithId: { folderId: itemId, sharedWithId: sharedWithUser.id } }),
    },
    update: { permission },
    create: {
      ownerId: userId,
      ...(itemType === 'file' ? { fileId: itemId } : { folderId: itemId }),
      sharedWithId: sharedWithUser.id,
      permission,
    },
    include: {
      sharedWith: { select: { id: true, email: true, name: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Item shared successfully',
    share,
  });
});

export const revokeShare = asyncHandler(async (req, res, next) => {
  const { shareId } = req.params;
  const userId = req.user.id;

  const share = await prisma.share.findUnique({
    where: { id: shareId },
  });

  if (!share) {
    throw new AppError('Share not found', 404);
  }

  if (share.ownerId !== userId) {
    throw new AppError('You do not have permission to revoke this share', 403);
  }

  await prisma.share.delete({
    where: { id: shareId },
  });

  res.status(200).json({
    success: true,
    message: 'Share revoked successfully',
  });
});

export const getShares = asyncHandler(async (req, res, next) => {
  const { itemId, itemType } = req.params;
  const userId = req.user.id;

  // Verify ownership
  const model = itemType === 'file' ? prisma.file : prisma.folder;
  const item = await model.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (item.ownerId !== userId) {
    throw new AppError('You do not have permission to view shares', 403);
  }

  const shares = await prisma.share.findMany({
    where: {
      ownerId: userId,
      ...(itemType === 'file' ? { fileId: itemId } : { folderId: itemId }),
    },
    include: {
      sharedWith: { select: { id: true, email: true, name: true } },
    },
  });

  res.status(200).json({
    success: true,
    shares,
  });
});

export const createPublicLink = asyncHandler(async (req, res, next) => {
  const { itemId, itemType, expiresAt, password, permission = 'VIEWER' } = req.validatedData;
  const userId = req.user.id;

  // Verify ownership
  const model = itemType === 'file' ? prisma.file : prisma.folder;
  const item = await model.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (item.ownerId !== userId) {
    throw new AppError('You do not have permission to create public links', 403);
  }

  const token = uuidv4();
  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

  const publicLink = await prisma.publicLink.create({
    data: {
      token,
      ownerId: userId,
      ...(itemType === 'file' ? { fileId: itemId } : { folderId: itemId }),
      password: hashedPassword,
      permission,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  const publicUrl = `${process.env.CLIENT_URL}/shared/${token}`;

  res.status(201).json({
    success: true,
    message: 'Public link created successfully',
    link: {
      ...publicLink,
      publicUrl,
    },
  });
});

export const getPublicLinks = asyncHandler(async (req, res, next) => {
  const { itemId, itemType } = req.params;
  const userId = req.user.id;

  // Verify ownership
  const model = itemType === 'file' ? prisma.file : prisma.folder;
  const item = await model.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (item.ownerId !== userId) {
    throw new AppError('You do not have permission to view public links', 403);
  }

  const links = await prisma.publicLink.findMany({
    where: {
      ownerId: userId,
      ...(itemType === 'file' ? { fileId: itemId } : { folderId: itemId }),
    },
  });

  res.status(200).json({
    success: true,
    links: links.map((link) => ({
      ...link,
      publicUrl: `${process.env.CLIENT_URL}/shared/${link.token}`,
    })),
  });
});

export const revokePublicLink = asyncHandler(async (req, res, next) => {
  const { linkId } = req.params;
  const userId = req.user.id;

  const link = await prisma.publicLink.findUnique({
    where: { id: linkId },
  });

  if (!link) {
    throw new AppError('Link not found', 404);
  }

  if (link.ownerId !== userId) {
    throw new AppError('You do not have permission to revoke this link', 403);
  }

  await prisma.publicLink.delete({
    where: { id: linkId },
  });

  res.status(200).json({
    success: true,
    message: 'Public link revoked successfully',
  });
});

export const accessPublicLink = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const link = await prisma.publicLink.findUnique({
    where: { token },
    include: {
      file: { select: { id: true, name: true, mimeType: true, size: true } },
      folder: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  if (!link) {
    throw new AppError('Link not found or has expired', 404);
  }

  // Check expiration
  if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
    throw new AppError('Link has expired', 410);
  }

  // Check password
  if (link.password) {
    if (!password) {
      throw new AppError('Password required', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, link.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401);
    }
  }

  res.status(200).json({
    success: true,
    item: link.file ? { ...link.file, size: link.file.size.toString() } : link.folder,
    owner: link.owner,
    itemType: link.file ? 'file' : 'folder',
    permission: link.permission,
  });
});

export const downloadPublicLink = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const link = await prisma.publicLink.findUnique({ where: { token }, include: { file: true } });
  if (!link || !link.file) throw new AppError('Link not found or has expired', 404);
  if (link.expiresAt && new Date() > new Date(link.expiresAt)) throw new AppError('Link has expired', 410);
  if (link.password) {
    const password = req.query.password;
    if (!password || !(await bcrypt.compare(password, link.password))) throw new AppError('Invalid password', 401);
  }
  if (!link.file.fileData) throw new AppError('File data not available', 404);
  res.setHeader('Content-Type', link.file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${link.file.name}"`);
  res.send(link.file.fileData);
});
