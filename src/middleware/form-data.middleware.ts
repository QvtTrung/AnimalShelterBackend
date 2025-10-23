import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { validateAndParseAsync, formatZodError } from '../utils/validation';

export const validateFormData = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // For form-data, the body might already be flattened
      // So we need to check if it's already flattened or needs to be nested
      let dataToValidate: any = {};

      // Check if the body is already in the correct format (nested under 'body')
      // or if it's flattened (direct fields)
      if (req.body && Object.keys(req.body).length > 0) {
        // If the schema expects a body object, but the data is flattened
        if (schema._def.typeName === 'ZodObject' && 
            schema._def.shape().body && 
            !req.body.body) {
          // Create a nested structure for validation
          dataToValidate.body = req.body;
        } else {
          // Use the body as is
          dataToValidate = req.body;
        }
      }

      if (req.query && Object.keys(req.query).length > 0) {
        dataToValidate.query = req.query;
      }

      if (req.params && Object.keys(req.params).length > 0) {
        dataToValidate.params = req.params;
      }

      // Only validate if there's data to validate
      if (Object.keys(dataToValidate).length > 0) {
        await validateAndParseAsync(schema, dataToValidate);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
