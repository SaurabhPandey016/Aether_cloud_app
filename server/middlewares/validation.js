import { AppError } from '../utils/errors.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const data = req.body;
      const validatedData = schema.parse(data);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.query);
      req.validatedQuery = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};
