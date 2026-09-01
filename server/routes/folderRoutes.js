import express from 'express';
import {
  createFolder,
  getFolders,
  getFolderDetails,
  renameFolder,
  moveFolder,
  deleteFolder,
  getBreadcrumbs,
} from '../controllers/folderController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { createFolderSchema, renameFolderSchema, moveFolderSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateRequest(createFolderSchema), asyncHandler(createFolder));
router.get('/', asyncHandler(getFolders));
router.get('/:folderId', asyncHandler(getFolderDetails));
router.get('/:folderId/breadcrumbs', asyncHandler(getBreadcrumbs));
router.put('/:folderId', validateRequest(renameFolderSchema), asyncHandler(renameFolder));
router.patch('/:folderId/move', validateRequest(moveFolderSchema), asyncHandler(moveFolder));
router.delete('/:folderId', asyncHandler(deleteFolder));

export default router;
