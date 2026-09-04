import express from 'express';
import { searchItems, getSharedWithMe, getSharedByMe } from '../controllers/searchController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateQuery } from '../middlewares/validation.js';
import { searchSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validateQuery(searchSchema), asyncHandler(searchItems));
router.get('/shared/with-me', asyncHandler(getSharedWithMe));
router.get('/shared/by-me', asyncHandler(getSharedByMe));

export default router;
