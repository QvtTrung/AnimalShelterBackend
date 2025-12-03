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
    sendError(res, new AppError(400, 'fail', 'Tin nhắn là bắt buộc và không được để trống'));
    return;
  }

  // Validate conversation history if provided
  if (conversationHistory && !Array.isArray(conversationHistory)) {
    sendError(res, new AppError(400, 'fail', 'Lịch sử trò chuyện phải là một mảng'));
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
    sendError(res, new AppError(500, 'error', 'Không thể xử lý tin nhắn. Vui lòng thử lại.'), 500);
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
    sendError(res, new AppError(400, 'fail', 'Dữ liệu hình ảnh là bắt buộc với mimeType và dữ liệu base64'));
    return;
  }

  // Validate mime type
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validMimeTypes.includes(image.mimeType)) {
    sendError(res, new AppError(400, 'fail', 'Định dạng hình ảnh không hợp lệ. Các định dạng được hỗ trợ: JPEG, PNG, WebP'));
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
    sendError(res, new AppError(500, 'error', 'Không thể phân tích hình ảnh. Vui lòng thử lại.'), 500);
  }
});
