import express from 'express';
import { signup, login, logout, getCurrentUser, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { signupSchema, loginSchema } from '../utils/validators.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

router.post('/signup', validateRequest(signupSchema), asyncHandler(signup));
router.post('/login', validateRequest(loginSchema), asyncHandler(login));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(getCurrentUser));
router.put('/profile', authenticate, asyncHandler(updateProfile));

export default router;
