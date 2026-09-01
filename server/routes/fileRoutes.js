import express from 'express';
import multer from 'multer';
import {
  uploadFile,
  getFiles,
  downloadFile,
  renameFile,
  moveFile,
  deleteFile,
  toggleFavorite,
  getFavoriteFiles,
  getRecentFiles,
} from '../controllers/fileController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { renameFileSchema, moveFileSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

// Multer configuration - upload files to memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Accept any file
    cb(null, true);
  },
});

// Apply authentication to all routes
router.use(authenticate);

// File upload - upload single file and pass to controller
router.post('/upload', upload.single('file'), uploadFile);

router.get('/', asyncHandler(getFiles));
router.get('/favorites', asyncHandler(getFavoriteFiles));
router.get('/recent', asyncHandler(getRecentFiles));
router.get('/:fileId/download', asyncHandler(downloadFile));
router.put('/:fileId', validateRequest(renameFileSchema), asyncHandler(renameFile));
router.patch('/:fileId/move', validateRequest(moveFileSchema), asyncHandler(moveFile));
router.patch('/:fileId/favorite', asyncHandler(toggleFavorite));
router.delete('/:fileId', asyncHandler(deleteFile));

export default router;
