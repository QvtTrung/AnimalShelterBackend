import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import {
  validateAndParseAsync,
  validateAndParse,
  validateFileUpload as validateFileUploadUtil,
  fileUploadSchema,
  extractDirectusData
} from '../utils/validation';

export const validateSchema = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Create a data object with all possible request parts
      const dataToValidate: any = {};

      // Only include parts that have data
      if (req.body && Object.keys(req.body).length > 0) {
        dataToValidate.body = req.body;
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

export const validateFileUpload = () => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate file upload using the standardized function
      validateFileUploadUtil(req.file, req.files);

      // Validate file structure using schema
      validateAndParse(fileUploadSchema, {
        file: req.file,
        files: req.files
      });

      next();
    } catch (error) {
      return next(error);
    }
  };
};

// Middleware to validate and extract Directus data
export const validateDirectusResponse = () => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // If there's a response body, extract Directus data
      if (req.body && typeof req.body === 'object') {
        const extractedData = extractDirectusData(req.body);
        if (extractedData) {
          req.body = extractedData;
        }
      }
      next();
    } catch (error) {
      return next(error);
    }
  };
};