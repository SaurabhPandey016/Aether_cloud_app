import express from 'express';
import {
  shareWithUser,
  shareWithLink,
  revokeShare,
  getShares,
  createPublicLink,
  getPublicLinks,
  revokePublicLink,
  accessPublicLink,
  downloadPublicLink,
  renamePublicLinkItem,
} from '../controllers/shareController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { createShareSchema, createPublicLinkSchema, shareWithLinkSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

// Public routes
router.post('/public-link/:token/access', asyncHandler(accessPublicLink));
router.get('/public-link/:token/download', asyncHandler(downloadPublicLink));
router.patch('/public-link/:token/item', asyncHandler(renamePublicLinkItem));

// Protected routes
router.use(authenticate);

router.post('/user', validateRequest(createShareSchema), asyncHandler(shareWithUser));
router.post('/user-with-link', validateRequest(shareWithLinkSchema), asyncHandler(shareWithLink));
router.delete('/:shareId', asyncHandler(revokeShare));
router.get('/:itemType/:itemId', asyncHandler(getShares));

router.post('/link', validateRequest(createPublicLinkSchema), asyncHandler(createPublicLink));
router.get('/links/:itemType/:itemId', asyncHandler(getPublicLinks));
router.delete('/link/:linkId', asyncHandler(revokePublicLink));

export default router;
