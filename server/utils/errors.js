import fs from 'fs';
import path from 'path';

// Log to file for debugging
function logToFile(data) {
  try {
    const logDir = './logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    const timestamp = new Date().toISOString();
    const logFile = path.join(logDir, 'errors.log');
    fs.appendFileSync(logFile, `[${timestamp}] ${JSON.stringify(data)}\n`);
  } catch (e) {
    // Ignore logging errors
  }
}

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Validation errors (Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors,
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `${err.meta?.target?.[0] || 'Field'} already exists`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
    });
  }

  // Known operational errors
  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown errors - log and return generic message
  console.error('Unexpected error:', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack?.split('\n').slice(0, 3),
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
