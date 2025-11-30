import { GoogleGenerativeAI } from '@google/generative-ai';
import config from './index';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Get the generative model (using Gemini 2.5 Flash)
export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
});

// Get the vision model for image analysis (using Gemini 2.5 Flash)
export const geminiVisionModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
});

export default genAI;
