import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import chatbotService from '../services/chatbot.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  image?: {
    mimeType: string;
    data: string;
  };
}

/**
 * Process a chat message
 * POST /api/chatbot/message
 */
export const processChatMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message, conversationHistory = [], image }: ChatRequest = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    sendError(res, new AppError(400, 'fail', 'Message is required and must be a non-empty string'));
    return;
  }

  // Validate conversation history if provided
  if (conversationHistory && !Array.isArray(conversationHistory)) {
    sendError(res, new AppError(400, 'fail', 'Conversation history must be an array'));
    return;
  }

  try {
    const response = await chatbotService.processMessage(message, conversationHistory, image);

    sendSuccess(res, {
      response,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error processing chat message:', error);
    sendError(res, new AppError(500, 'error', 'Failed to process message. Please try again.'), 500);
  }
});

/**
 * Get conversation starters
 * GET /api/chatbot/starters
 */
export const getConversationStarters = asyncHandler(async (_req: Request, res: Response) => {
  const starters = chatbotService.getConversationStarters();

  sendSuccess(res, { starters });
});

/**
 * Upload and analyze an image (for rescue assistance)
 * POST /api/chatbot/analyze-image
 */
export const analyzeImage = asyncHandler(async (req: Request, res: Response) => {
  const { image, message = 'What can you tell me about this animal?' }: { image: { mimeType: string; data: string }; message?: string } = req.body;

  if (!image || !image.mimeType || !image.data) {
    sendError(res, new AppError(400, 'fail', 'Image data is required with mimeType and base64 data'));
    return;
  }

  // Validate mime type
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validMimeTypes.includes(image.mimeType)) {
    sendError(res, new AppError(400, 'fail', 'Invalid image format. Supported formats: JPEG, PNG, WebP'));
    return;
  }

  try {
    const response = await chatbotService.processMessage(message, [], image);

    sendSuccess(res, {
      response,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error analyzing image:', error);
    sendError(res, new AppError(500, 'error', 'Failed to analyze image. Please try again.'), 500);
  }
});
