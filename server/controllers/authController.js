import bcrypt from 'bcrypt';
import { AppError, asyncHandler } from '../utils/errors.js';
import prisma from '../config/database.js';

export const signup = asyncHandler(async (req, res, next) => {
  const { email, password, name } = req.validatedData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
    select: { id: true, email: true, name: true },
  });

  // Create root folder for user
  await prisma.folder.create({
    data: {
      name: 'My Files',
      ownerId: user.id,
    },
  });

  // Set session
  req.session.userId = user.id;

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    user,
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.validatedData;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, password: true },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Set session
  req.session.userId = user.id;

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

export const logout = asyncHandler(async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      throw new AppError('Could not log out', 500);
    }

    // Clear session cookie - use the same name as in server.js configuration
    res.clearCookie('aethercloud-session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

export const getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, avatar: true, createdAt: true },
  });

  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name && { name }),
      ...(avatar && { avatar }),
    },
    select: { id: true, email: true, name: true, avatar: true },
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});
