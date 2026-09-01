import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { itemId, itemType } = req.params;

      if (!itemId || !itemType) {
        throw new AppError('Item ID and type are required', 400);
      }

      const model = itemType === 'file' ? prisma.file : prisma.folder;
      const item = await model.findUnique({
        where: { id: itemId },
        include: {
          owner: true,
          shares: {
            where: { sharedWithId: req.user.id },
            include: { sharedWith: true },
          },
        },
      });

      if (!item) {
        throw new AppError('Item not found', 404);
      }

      // Check ownership
      if (item.ownerId === req.user.id) {
        req.permission = 'OWNER';
        req.item = item;
        return next();
      }

      // Check shared access
      if (item.shares && item.shares.length > 0) {
        const share = item.shares[0];
        req.permission = share.permission;
        req.item = item;

        // Check permission requirement
        if (requiredPermission === 'EDITOR' && req.permission === 'VIEWER') {
          throw new AppError('Insufficient permissions', 403);
        }

        return next();
      }

      throw new AppError('Access denied', 403);
    } catch (error) {
      next(error);
    }
  };
};
