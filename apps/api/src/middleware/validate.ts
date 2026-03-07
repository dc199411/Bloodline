import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body) as T;
      req.body = parsed;
      next();
    } catch (err) {
      const zodError = err as ZodError;
      res.status(400).json({
        error: 'Validation failed',
        details: zodError.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
  };
}
