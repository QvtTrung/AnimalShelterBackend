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
      return "Hiện tại mình đang nhận được nhiều yêu cầu quá. Bạn thử lại sau vài giây nhé, hoặc mình có thể giúp bạn ngay với các lựa chọn sau:\n\n" +
        "• Ghé trang Thú cưng để xem các bé đang có sẵn\n" +
        "• Trường hợp khẩn cấp, hãy liên hệ bác sĩ thú y hoặc đội cứu hộ động vật địa phương\n" +
        "• Gọi trực tiếp cho chúng mình để được hỗ trợ ngay";
    }
    
    logger.error(`Error in ${context}:`, error);
    return "Xin lỗi bạn, mình đang gặp chút trục trặc. Bạn thử lại sau giây lát nhé.";
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

    // Keywords for pet search (English and Vietnamese)
    const petSearchKeywords = [
      'adopt', 'adoption', 'pet', 'dog', 'cat', 'animal', 'looking for', 'find', 'search', 'available', 'breed',
      'nhận nuôi', 'nuôi', 'thú cưng', 'chó', 'mèo', 'động vật', 'tìm', 'tìm kiếm', 'có sẵn', 'giống',
    ];

    // Keywords for rescue help (English and Vietnamese)
    const rescueHelpKeywords = [
      'rescue', 'injured', 'hurt', 'help', 'first aid', 'emergency', 'save', 'found', 'stray', 'calm', 'scared', 'aggressive',
      'cứu', 'cứu hộ', 'bị thương', 'đau', 'giúp', 'sơ cứu', 'khẩn cấp', 'cấp cứu', 'bị lạc', 'hoang', 'sợ hãi', 'hung dữ',
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
Trích xuất tiêu chí tìm kiếm thú cưng từ tin nhắn này: "${message}"

Trả về một đối tượng JSON với các trường sau (chỉ bao gồm các trường được đề cập):
- species: "dog" (chó), "cat" (mèo), hoặc "other" (khác)
- age: "young" (0-2 tuổi), "adult" (3-7 tuổi), hoặc "senior" (8+ tuổi)
- size: "small" (nhỏ), "medium" (vừa), hoặc "large" (lớn)
- gender: "male" (đực/trống), hoặc "female" (cái/mái)

Nếu không có tiêu chí cụ thể nào được đề cập, trả về đối tượng rỗng {}.
CHỈ trả về JSON hợp lệ, không có văn bản khác.
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
Bạn là trợ lý hỗ trợ nhận nuôi thú cưng thân thiện, ấm áp. Người dùng hỏi: "${message}"

Mình tìm thấy những bé đáng yêu này (${pets.length} bé đang có sẵn):
${pets.map((p, i) => `
${i + 1}. **${p.name}** - ${p.species === 'dog' ? 'Chó' : p.species === 'cat' ? 'Mèo' : p.species}
   Tuổi: ${p.age} ${p.age_unit === 'months' ? 'tháng' : 'tuổi'}, Kích thước: ${p.size === 'small' ? 'nhỏ' : p.size === 'medium' ? 'vừa' : p.size === 'large' ? 'lớn' : 'vừa'}, Giới tính: ${p.gender === 'male' ? 'đực' : p.gender === 'female' ? 'cái' : 'chưa rõ'}
   Link: ${frontendUrl}/pets/${p.id}
   ${p.description || 'Một người bạn ngọt ngào đang tìm kiếm tình yêu thương!'}
`).join('\n')}

Viết phản hồi NGẮN GỌN, chân thành bằng TIẾNG VIỆT (tối đa 120 từ):
- Thật sự ấm áp và khuyến khích (không quá nhiệt tình)
- Giới thiệu 2-3 bé phù hợp nhất một cách tự nhiên
- Mỗi bé: **Tên** (tuổi, kích thước, giới tính) + một đặc điểm đáng yêu
- Bao gồm: [Gặp Tên]({link})
- Nếu không có kết quả phù hợp: gợi ý thay thế một cách ấm áp
- Kết thúc bằng: "Bạn có muốn biết thêm về bé nào không?"

Giọng điệu: Chân thành, hữu ích, trò chuyện (như nói chuyện với bạn bè).
Tránh: Quá hào hứng, ngôn ngữ trang trọng, giọng điệu bán hàng.
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
Bạn là trợ lý chuyên môn thú y. Phân tích hình ảnh động vật này và cung cấp:
1. Nhận diện loài (nếu nhìn thấy được)
2. Tình trạng quan sát được (vết thương, dấu hiệu đau đớn, ngôn ngữ cơ thể)
3. Mức độ khẩn cấp (thấp, trung bình, cao, nguy kịch)
4. Các vấn đề sức khỏe có thể nhìn thấy

Hãy cụ thể nhưng ngắn gọn. Nếu không thể nhìn rõ điều gì, hãy nói rõ.
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
Bạn là người hướng dẫn cứu hộ động vật chu đáo, đang giúp đỡ ai đó cần hỗ trợ.

Tình huống: "${message}"
${analysisContext ? `\nNhững gì mình nhìn thấy: ${analysisContext}` : ''}

Cung cấp hướng dẫn NGẮN GỌN, chu đáo bằng TIẾNG VIỆT (tối đa 180 từ):

**Cần làm ngay:**
- 2-3 bước rõ ràng, nhẹ nhàng
- Bắt đầu với hành động quan trọng nhất

**Giữ an toàn cho mọi người:**
- Các mẹo an toàn chính (cho cả người và động vật)
- Cách tiếp cận một cách bình tĩnh

**Khi nào cần gọi bác sĩ thú y:**
- Các dấu hiệu cần chăm sóc chuyên nghiệp

Giọng điệu: Bình tĩnh, chu đáo, hỗ trợ (như giúp đỡ một người bạn).
Tránh: Cảnh báo khẩn cấp, báo động, hướng dẫn trang trọng.
Sử dụng: Ngôn ngữ đơn giản, cụm từ trấn an, mẹo thực tế.

Nếu nghiêm trọng: Nhẹ nhàng đề xuất chăm sóc thú y mà không gây lo lắng.
Kết thúc bằng: "Bạn đang làm đúng khi giúp đỡ. Cho mình biết nếu bạn cần thêm hướng dẫn nhé."
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
Bạn là trợ lý thân thiện tại trại cứu hộ động vật "Second Chance Sanctuary".

Chúng mình làm gì: Giúp mọi người nhận nuôi thú cưng và cứu hộ động vật cần giúp đỡ.

Người dùng: "${message}"

Trò chuyện gần đây:
${history.slice(-2).map((h) => `${h.role}: ${h.content}`).join('\n')}

Hướng dẫn phản hồi bằng TIẾNG VIỆT (tối đa 80 từ):
- Ấm áp, chân thành và chu đáo - như một người bạn đáng tin cậy thực sự muốn giúp đỡ
- Lắng nghe trước, hiểu nhu cầu của họ
- Với câu hỏi về nhận nuôi: Hỏi về lối sống và sở thích của họ với sự quan tâm thật sự
- Với lo ngại về cứu hộ: Thể hiện sự đồng cảm và hỏi những câu hỏi nhẹ nhàng để hiểu tình huống
- Giữ tự nhiên và trò chuyện, không trang trọng
- Kết thúc bằng một câu hỏi chu đáo, hữu ích

Giọng điệu: Chân thành, chu đáo, dễ gần. Như đang nói chuyện với một người bạn cần hỗ trợ.
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
      'Mình muốn nhận nuôi chó. Các bạn có bé nào không?',
      'Bạn có thể giúp mình tìm mèo phù hợp với trẻ em không?',
      'Mình tìm thấy động vật hoang bị thương. Nên làm gì?',
      'Làm sao để làm dịu một chú chó đang sợ hãi?',
      'Các yêu cầu nhận nuôi là gì?',
    ];
  }
}

export default new ChatbotService();
