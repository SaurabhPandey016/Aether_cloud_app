import express from 'express';
import {
  getTrash,
  restoreFromTrash,
  emptyTrash,
  permanentlyDeleteItem,
} from '../controllers/trashController.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getTrash));
router.post('/:trashId/restore', asyncHandler(restoreFromTrash));
router.delete('/', asyncHandler(emptyTrash));
router.delete('/:trashId', asyncHandler(permanentlyDeleteItem));

export default router;
