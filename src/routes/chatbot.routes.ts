import { Router } from 'express';
import { processChatMessage, getConversationStarters, analyzeImage } from '../controllers/chatbot.controller';

const router = Router();

/**
 * POST /api/chatbot/message
 * Process a chat message with optional conversation history
 */
router.post('/message', processChatMessage);

/**
 * GET /api/chatbot/starters
 * Get conversation starter suggestions
 */
router.get('/starters', getConversationStarters);

/**
 * POST /api/chatbot/analyze-image
 * Analyze an image for rescue assistance
 */
router.post('/analyze-image', analyzeImage);

export default router;
