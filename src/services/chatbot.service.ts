import { geminiModel, geminiVisionModel } from '../config/gemini';
import { publicDirectus } from '../config/directus';
import { readItems } from '@directus/sdk';
import { logger } from '../utils/logger';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PetSearchCriteria {
  species?: string;
  age?: string;
  size?: string;
  gender?: string;
}

class ChatbotService {
  /**
   * Handle Gemini API errors with user-friendly messages
   */
  private handleGeminiError(error: any, context: string): string {
    if (error.status === 429) {
      logger.warn(`Rate limit hit in ${context}`);
      return "I'm currently experiencing high demand. Please try again in a few seconds, or I can help you right away with these options:\n\n" +
        "• Visit our Pets page to browse available animals\n" +
        "• For emergencies, contact your local veterinarian or animal rescue service\n" +
        "• Call us directly for immediate assistance";
    }
    
    logger.error(`Error in ${context}:`, error);
    return "I apologize, but I'm having trouble responding right now. Please try again in a moment.";
  }

  /**
   * Process a chat message with context-aware AI
   */
  async processMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    imageData?: { mimeType: string; data: string }
  ): Promise<string> {
    try {
      // Determine the intent of the message
      const intent = await this.detectIntent(message);

      let response: string;

      if (intent === 'pet_search') {
        response = await this.handlePetSearch(message, conversationHistory);
      } else if (intent === 'rescue_help' || imageData) {
        response = await this.handleRescueGuidance(message, imageData, conversationHistory);
      } else {
        response = await this.handleGeneralQuery(message, conversationHistory);
      }

      return response;
    } catch (error) {
      logger.error('Error processing chatbot message:', error);
      throw error;
    }
  }

  /**
   * Detect the intent of the user's message
   */
  private async detectIntent(message: string): Promise<'pet_search' | 'rescue_help' | 'general'> {
    const lowerMessage = message.toLowerCase();

    // Keywords for pet search
    const petSearchKeywords = [
      'adopt',
      'adoption',
      'pet',
      'dog',
      'cat',
      'animal',
      'looking for',
      'find',
      'search',
      'available',
      'breed',
    ];

    // Keywords for rescue help
    const rescueHelpKeywords = [
      'rescue',
      'injured',
      'hurt',
      'help',
      'first aid',
      'emergency',
      'save',
      'found',
      'stray',
      'calm',
      'scared',
      'aggressive',
    ];

    const hasPetKeywords = petSearchKeywords.some((keyword) => lowerMessage.includes(keyword));
    const hasRescueKeywords = rescueHelpKeywords.some((keyword) => lowerMessage.includes(keyword));

    if (hasRescueKeywords) {
      return 'rescue_help';
    } else if (hasPetKeywords) {
      return 'pet_search';
    } else {
      return 'general';
    }
  }

  /**
   * Handle pet search queries
   */
  private async handlePetSearch(message: string, _history: ChatMessage[]): Promise<string> {
    try {
      // Extract search criteria using Gemini
      const criteriaPrompt = `
Extract pet search criteria from this message: "${message}"

Return a JSON object with these fields (only include fields that are mentioned):
- species: "dog", "cat", or "other"
- age: "young" (0-2 years), "adult" (3-7 years), or "senior" (8+ years)
- size: "small", "medium", or "large"
- gender: "male" or "female"

If no specific criteria are mentioned, return an empty object {}.
Return ONLY valid JSON, no other text.
`;

      const criteriaResult = await geminiModel.generateContent(criteriaPrompt);
      const criteriaText = criteriaResult.response.text().trim();

      // Parse criteria (handle potential JSON parsing issues)
      let criteria: PetSearchCriteria = {};
      try {
        const jsonMatch = criteriaText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          criteria = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        logger.warn('Could not parse criteria JSON:', criteriaText);
      }

      // Fetch available pets from database
      const pets = await this.fetchAvailablePets(criteria);

      // Generate response with pet recommendations
      const frontendUrl = 'http://localhost:5173';
      const responsePrompt = `
You are a warm, friendly pet adoption helper. User asked: "${message}"

I found these adorable pets (${pets.length} available):
${pets.map((p, i) => `
${i + 1}. **${p.name}** - ${p.species}
   Age: ${p.age} ${p.age_unit || 'years'}, Size: ${p.size || 'medium'}, Gender: ${p.gender || 'unknown'}
   Link: ${frontendUrl}/pets/${p.id}
   ${p.description || 'A sweet companion looking for love!'}
`).join('\n')}

Write a BRIEF, sincere response (max 120 words):
- Be genuinely warm and encouraging (not overly enthusiastic)
- Present 2-3 best matches naturally
- For each: **Name** (age, size, gender) + one endearing trait
- Include: [Meet Name]({link})
- If no matches: warmly suggest alternatives
- End with: "Would you like to know more about any of them?"

Tone: Sincere, helpful, conversational (like talking to a friend).
Avoid: Excessive excitement, formal language, sales-pitch tone.
`;

      const result = await geminiModel.generateContent(responsePrompt);
      return result.response.text();
    } catch (error) {
      return this.handleGeminiError(error, 'pet search handler');
    }
  }

  /**
   * Fetch available pets based on criteria
   */
  private async fetchAvailablePets(criteria: PetSearchCriteria): Promise<any[]> {
    try {
      const filter: any = {
        status: { _eq: 'available' },
      };

      if (criteria.species) {
        filter.species = { _eq: criteria.species };
      }

      if (criteria.size) {
        filter.size = { _eq: criteria.size };
      }

      if (criteria.gender) {
        filter.gender = { _eq: criteria.gender };
      }

      // Handle age filtering
      if (criteria.age) {
        if (criteria.age === 'young') {
          filter.age = { _lte: 2 };
        } else if (criteria.age === 'adult') {
          filter.age = { _between: [3, 7] };
        } else if (criteria.age === 'senior') {
          filter.age = { _gte: 8 };
        }
      }

      const pets = await publicDirectus.request(
        readItems('pets', {
          filter,
          limit: 20,
          fields: ['id', 'name', 'species', 'age', 'age_unit', 'size', 'gender', 'description', 'status'],
        })
      );

      return pets;
    } catch (error) {
      logger.error('Error fetching pets:', error);
      return [];
    }
  }

  /**
   * Handle rescue guidance queries with optional image
   */
  private async handleRescueGuidance(
    message: string,
    imageData?: { mimeType: string; data: string },
    _history?: ChatMessage[]
  ): Promise<string> {
    try {
      let analysisContext = '';

      // If image is provided, analyze it first
      if (imageData) {
        const imageAnalysisPrompt = `
You are a veterinary expert assistant. Analyze this image of an animal and provide:
1. Species identification (if visible)
2. Observable condition (injuries, distress signs, body language)
3. Urgency level (low, medium, high, critical)
4. Any visible health concerns

Be specific but concise. If you can't clearly see something, say so.
`;

        const imageParts = [
          { text: imageAnalysisPrompt },
          {
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data,
            },
          },
        ];

        const imageResult = await geminiVisionModel.generateContent(imageParts);
        analysisContext = imageResult.response.text();
      }

      // Generate rescue guidance
      const guidancePrompt = `
You are a caring animal rescue guide helping someone in need.

Situation: "${message}"
${analysisContext ? `\nWhat I can see: ${analysisContext}` : ''}

Provide BRIEF, caring guidance (max 180 words):

**What to do now:**
- 2-3 clear, gentle steps
- Start with the most important action

**Keeping everyone safe:**
- Key safety tips (for both person and animal)
- How to approach calmly

**When to call a vet:**
- Signs that need professional care

Tone: Calm, caring, supportive (like helping a friend).
Avoid: Urgent warnings, alarm, formal instructions.
Use: Simple language, reassuring phrases, practical tips.

If serious: Gently recommend vet care without alarming.
End with: "You're doing the right thing by helping. Let me know if you need more guidance."
`;

      const result = await geminiModel.generateContent(guidancePrompt);
      return result.response.text();
    } catch (error) {
      return this.handleGeminiError(error, 'rescue guidance handler');
    }
  }

  /**
   * Handle general queries about the shelter or services
   */
  private async handleGeneralQuery(message: string, history: ChatMessage[]): Promise<string> {
    try {
      const contextPrompt = `
You're a friendly helper at "Second Chance Sanctuary" animal shelter.

What we do: Help people adopt pets and rescue animals in need.

User: "${message}"

Recent chat:
${history.slice(-2).map((h) => `${h.role}: ${h.content}`).join('\n')}

Response guidelines (max 80 words):
- Be warm, sincere, and caring - like a trusted friend who genuinely wants to help
- Listen first, understand their needs
- For adoption questions: Ask about their lifestyle and preferences with genuine interest
- For rescue concerns: Show empathy and ask gentle questions to understand the situation
- Keep it natural and conversational, not formal
- End with a thoughtful, helpful question

Tone: Sincere, caring, approachable. Think of talking to a friend who needs your support.
`;

      const result = await geminiModel.generateContent(contextPrompt);
      return result.response.text();
    } catch (error) {
      return this.handleGeminiError(error, 'general query handler');
    }
  }

  /**
   * Get conversation starter suggestions
   */
  getConversationStarters(): string[] {
    return [
      "I'm looking to adopt a dog. What do you have available?",
      'Can you help me find a cat that would be good with children?',
      'I found an injured stray animal. What should I do?',
      'How do I calm down a scared dog?',
      'What are the adoption requirements?',
    ];
  }
}

export default new ChatbotService();
