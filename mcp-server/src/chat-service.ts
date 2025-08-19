import { v4 as uuidv4 } from 'uuid';
import { ChatSession, ChatMessage, CreateChatSessionSchema, SendChatMessageSchema } from './types.js';
import { SkipifyClient } from './skipify-client.js';

export class ChatService {
  private sessions: Map<string, ChatSession> = new Map();
  private skipifyClients: Map<string, SkipifyClient> = new Map();

  /**
   * Create a new chat session
   */
  async createSession(data: { merchantId?: string; initialMessage?: string }): Promise<ChatSession> {
    const validatedData = CreateChatSessionSchema.parse(data);
    const sessionId = uuidv4();
    
    const session: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      merchantId: validatedData.merchantId,
    };

    // Create Skipify client for this session
    if (validatedData.merchantId) {
      const skipifyClient = new SkipifyClient(validatedData.merchantId, 'stage');
      await skipifyClient.initializeSession();
      this.skipifyClients.set(sessionId, skipifyClient);
      session.skipifySessionId = skipifyClient.getSessionId() || undefined;
    }

    // Add initial system message
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      type: 'system',
      content: `Chat session created. ${validatedData.merchantId ? `Merchant ID: ${validatedData.merchantId}` : 'No merchant ID provided.'}`,
      timestamp: new Date(),
    };
    session.messages.push(systemMessage);

    // Add initial user message if provided
    if (validatedData.initialMessage) {
      const userMessage: ChatMessage = {
        id: uuidv4(),
        type: 'user',
        content: validatedData.initialMessage,
        timestamp: new Date(),
      };
      session.messages.push(userMessage);
      
      // Generate assistant response
      const assistantMessage = await this.generateAssistantResponse(session, validatedData.initialMessage);
      session.messages.push(assistantMessage);
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Send a message in a chat session
   */
  async sendMessage(data: { sessionId: string; message: string; skipifyOperation?: 'lookup' | 'auth' | 'carousel' | 'none'; skipifyData?: Record<string, unknown> }): Promise<ChatMessage> {
    const validatedData = SendChatMessageSchema.parse(data);
    const session = this.sessions.get(validatedData.sessionId);
    
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      content: validatedData.message,
      timestamp: new Date(),
      metadata: {
        skipifyOperation: validatedData.skipifyOperation,
        skipifyData: validatedData.skipifyData,
      },
    };
    session.messages.push(userMessage);

    // Generate assistant response
    const assistantMessage = await this.generateAssistantResponse(session, validatedData.message, validatedData.skipifyOperation, validatedData.skipifyData);
    session.messages.push(assistantMessage);

    session.updatedAt = new Date();
    return assistantMessage;
  }

  /**
   * Get a chat session
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all chat sessions
   */
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Delete a chat session
   */
  deleteSession(sessionId: string): boolean {
    this.skipifyClients.delete(sessionId);
    return this.sessions.delete(sessionId);
  }

  /**
   * Get Skipify client for a session
   */
  getSkipifyClient(sessionId: string): SkipifyClient | undefined {
    return this.skipifyClients.get(sessionId);
  }

  /**
   * Extract email addresses from text using regex
   */
  private extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Extract phone numbers from text using regex
   */
  private extractPhones(text: string): string[] {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    return text.match(phoneRegex) || [];
  }

  /**
   * Extract monetary amounts from text
   */
  private extractAmounts(text: string): number[] {
    const amountRegex = /\$?(\d+(?:\.\d{2})?)/g;
    const matches = text.match(amountRegex) || [];
    return matches.map(match => {
      const num = parseFloat(match.replace('$', ''));
      return num < 1000 ? num * 100 : num; // Convert dollars to cents if needed
    });
  }

  /**
   * Detect intent from user message and extract parameters
   */
  private analyzeIntent(message: string): {
    intent: 'lookup' | 'auth' | 'carousel' | 'device_id' | 'help' | 'general' | 'none' | 'card_selection';
    confidence: number;
    parameters: Record<string, any>;
    description: string;
  } {
    const lowerMessage = message.toLowerCase();
    
    // PRIORITY 1: Payment methods / lookup intents (when email/phone present)
    if ((lowerMessage.includes('payment method') || 
        lowerMessage.includes('has payment') || 
        lowerMessage.includes('check for') ||
        lowerMessage.includes('lookup') ||
        lowerMessage.includes('find shopper') ||
        lowerMessage.includes('search for') ||
        lowerMessage.includes('are there') ||
        lowerMessage.includes('available')) && 
        // Must have email or phone to be a lookup
        (this.extractEmails(message).length > 0 || this.extractPhones(message).length > 0)) {
      
      const emails = this.extractEmails(message);
      const phones = this.extractPhones(message);
      
      return {
        intent: 'lookup',
        confidence: 0.95, // Higher confidence when email/phone present
        parameters: { 
          email: emails[0] || undefined,
          phone: phones[0] || undefined 
        },
        description: `Looking up shopper with ${emails[0] ? `email: ${emails[0]}` : `phone: ${phones[0]}`}`
      };
    }

    // Payment carousel intents (after lookup priority check) - must be showing/displaying payment UI
    if (lowerMessage.includes('carousel') || 
        lowerMessage.includes('show payment') ||
        lowerMessage.includes('payment carousel') ||
        lowerMessage.includes('show the payment') ||
        lowerMessage.includes('display payment') ||
        lowerMessage.includes('payment options') ||
        (lowerMessage.includes('show') && (lowerMessage.includes('payment') || lowerMessage.includes('$'))) ||
        (lowerMessage.includes('display') && lowerMessage.includes('payment')) ||
        (lowerMessage.includes('payment') && lowerMessage.includes('for') && lowerMessage.includes('$')) ||
        lowerMessage.includes('checkout')) {
      
      const amounts = this.extractAmounts(message);
      const phones = this.extractPhones(message);
      
      return {
        intent: 'carousel',
        confidence: 0.9, // Higher confidence for clear carousel requests
        parameters: { 
          amount: amounts[0] || 1000, // Default to $10.00
          phone: phones[0] || undefined 
        },
        description: `Payment carousel request for amount: $${(amounts[0] || 1000) / 100}`
      };
    }

    // Card selection intents (for selecting specific payment methods from carousel)
    if (lowerMessage.includes('select card') || 
        lowerMessage.includes('choose card') ||
        lowerMessage.includes('pick card') ||
        lowerMessage.includes('use card') ||
        lowerMessage.includes('select payment') ||
        lowerMessage.includes('choose payment') ||
        lowerMessage.includes('pick payment') ||
        lowerMessage.includes('use payment') ||
        lowerMessage.includes('select the') ||
        lowerMessage.includes('choose the') ||
        lowerMessage.includes('pick the') ||
        lowerMessage.includes('use the') ||
        lowerMessage.includes('ending in') ||
        lowerMessage.includes('ends with') ||
        lowerMessage.includes('last four') ||
        (lowerMessage.includes('select') && (lowerMessage.includes('first') || lowerMessage.includes('second') || lowerMessage.includes('third') || lowerMessage.includes('last'))) ||
        (lowerMessage.includes('choose') && (lowerMessage.includes('first') || lowerMessage.includes('second') || lowerMessage.includes('third') || lowerMessage.includes('last'))) ||
        lowerMessage.includes('card 1') || lowerMessage.includes('card 2') || lowerMessage.includes('card 3') ||
        lowerMessage.includes('card #1') || lowerMessage.includes('card #2') || lowerMessage.includes('card #3') ||
        lowerMessage.includes('payment 1') || lowerMessage.includes('payment 2') || lowerMessage.includes('payment 3') ||
        (lowerMessage.includes('use') && (lowerMessage.includes('visa') || lowerMessage.includes('mastercard') || lowerMessage.includes('amex') || lowerMessage.includes('discover') || lowerMessage.includes('paypal'))) ||
        (lowerMessage.includes('select') && (lowerMessage.includes('visa') || lowerMessage.includes('mastercard') || lowerMessage.includes('amex') || lowerMessage.includes('discover') || lowerMessage.includes('paypal')))) {
      
      // Extract card index/position
      let cardIndex = undefined;
      if (lowerMessage.includes('first') || lowerMessage.includes('card 1') || lowerMessage.includes('payment 1') || lowerMessage.includes('1st') || lowerMessage.includes('card #1')) {
        cardIndex = 1;
      } else if (lowerMessage.includes('second') || lowerMessage.includes('card 2') || lowerMessage.includes('payment 2') || lowerMessage.includes('2nd') || lowerMessage.includes('card #2')) {
        cardIndex = 2;
      } else if (lowerMessage.includes('third') || lowerMessage.includes('card 3') || lowerMessage.includes('payment 3') || lowerMessage.includes('3rd') || lowerMessage.includes('card #3')) {
        cardIndex = 3;
      } else if (lowerMessage.includes('fourth') || lowerMessage.includes('card 4') || lowerMessage.includes('payment 4') || lowerMessage.includes('4th') || lowerMessage.includes('card #4')) {
        cardIndex = 4;
      } else if (lowerMessage.includes('last') || lowerMessage.includes('final')) {
        cardIndex = 'last';
      }
      
      // Extract card ending digits
      let cardEnding = undefined;
      const endingMatch = message.match(/ending in (\d{4})|ends with (\d{4})|last four (\d{4})/i);
      if (endingMatch) {
        cardEnding = endingMatch[1] || endingMatch[2] || endingMatch[3];
      }
      
      // Extract card type if mentioned
      let cardType = undefined;
      if (lowerMessage.includes('visa')) cardType = 'visa';
      else if (lowerMessage.includes('mastercard') || lowerMessage.includes('master card')) cardType = 'mastercard';
      else if (lowerMessage.includes('amex') || lowerMessage.includes('american express')) cardType = 'amex';
      else if (lowerMessage.includes('discover')) cardType = 'discover';
      else if (lowerMessage.includes('paypal') || lowerMessage.includes('pay pal')) cardType = 'paypal';
      
      return {
        intent: 'card_selection',
        confidence: 0.9,
        parameters: { 
          cardIndex: cardIndex,
          cardType: cardType,
          cardEnding: cardEnding
        },
        description: `Card selection request: ${cardIndex ? `position ${cardIndex}` : ''}${cardType ? ` ${cardType} card` : ''}${cardEnding ? ` ending in ${cardEnding}` : ''}`
      };
    }

    // Lookup intents without email/phone (need clarification)
    if (lowerMessage.includes('payment method') || 
        lowerMessage.includes('has payment') || 
        lowerMessage.includes('check for') ||
        lowerMessage.includes('lookup') ||
        lowerMessage.includes('find shopper') ||
        lowerMessage.includes('search for')) {
      
      const emails = this.extractEmails(message);
      const phones = this.extractPhones(message);
      
      // Only return this if no email/phone found (specific cases handled above)
      if (emails.length === 0 && phones.length === 0) {
        return {
          intent: 'lookup',
          confidence: 0.7,
          parameters: {},
          description: 'Lookup intent detected but no email/phone found'
        };
      }
    }

    // Authentication intents (only for active auth requests, not past tense)
    if ((lowerMessage.includes('authenticate') && !lowerMessage.includes('authenticated')) || 
        (lowerMessage.includes('auth') && !lowerMessage.includes('authenticated')) ||
        lowerMessage.includes('verify') ||
        lowerMessage.includes('start authentication') ||
        (lowerMessage.includes('authenticate') && lowerMessage.includes('shopper')) ||
        (lowerMessage.includes('challenge') && lowerMessage.includes('with'))) {
      
      // Look for challenge ID patterns
      const challengeIdMatch = message.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
      const phones = this.extractPhones(message);
      
      return {
        intent: 'auth',
        confidence: 0.8,
        parameters: { 
          challengeId: challengeIdMatch ? challengeIdMatch[0] : undefined,
          phone: phones[0] || undefined 
        },
        description: 'Authentication request detected'
      };
    }

    // Device ID intents
    if (lowerMessage.includes('device') || lowerMessage.includes('device id')) {
      return {
        intent: 'device_id',
        confidence: 0.9,
        parameters: {},
        description: 'Device ID request detected'
      };
    }

    // Help intents
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return {
        intent: 'help',
        confidence: 0.9,
        parameters: {},
        description: 'Help request detected'
      };
    }

    return {
      intent: 'general',
      confidence: 0.3,
      parameters: {},
      description: 'General conversation'
    };
  }

  /**
   * Generate assistant response based on user message and Skipify operations
   */
  private async generateAssistantResponse(
    session: ChatSession, 
    userMessage: string, 
    skipifyOperation?: 'lookup' | 'auth' | 'carousel' | 'none' | 'card_selection' | 'device_id',
    skipifyData?: Record<string, unknown>
  ): Promise<ChatMessage> {
    let responseContent = '';
    let metadata: Record<string, unknown> = {};

    // First analyze the user message for intent if no explicit operation is provided
    const intentAnalysis = this.analyzeIntent(userMessage);
    console.log('Intent analysis:', intentAnalysis);

    // Use detected intent if no explicit operation is provided
    const operation = skipifyOperation && skipifyOperation !== 'none' 
      ? skipifyOperation 
      : (intentAnalysis.confidence > 0.7 ? intentAnalysis.intent : undefined);
    
    const operationData = skipifyData || intentAnalysis.parameters;

    // Check if this is a Skipify-related operation - return instructions for frontend SDK
    if (operation && operation !== 'none' && operation !== 'general' && operation !== 'help') {
      switch (operation) {
        case 'lookup':
          const email = operationData.email;
          
          if (userMessage.toLowerCase().includes('payment method')) {
            responseContent = `🔍 **Checking payment methods for ${email || operationData.phone}...**\n\n⏳ **Performing lookup using frontend SDK** - this will check if the shopper has saved payment methods in their Skipify wallet.\n\n💡 **What happens next:**\n1. The system will call the Skipify SDK lookup function\n2. Results will show if payment methods are available\n3. If found, you can proceed with authentication`;
          } else {
            responseContent = `🔍 **Performing Skipify lookup for ${email || operationData.phone}...**\n\n⏳ **Using frontend SDK** to securely check shopper information.`;
          }
          
          // Return metadata that tells frontend to execute the SDK call
          metadata = { 
            skipifyAction: 'lookup', 
            parameters: operationData,
            intent: intentAnalysis,
            executeSDK: true // Tell frontend to execute this
          };
          break;

        case 'auth':
          const challengeId = operationData.challengeId;
          
          if (challengeId) {
            responseContent = `🔐 **Initiating authentication...**\n\n⏳ **Using frontend SDK** to authenticate shopper with challenge ID: \`${challengeId}\`\n\n💡 **What happens next:**\n1. Authentication component will be displayed\n2. Shopper enters their verification code\n3. Once authenticated, you can show payment options`;
          } else {
            responseContent = `🔐 **Initiating authentication...**\n\n⏳ **Using frontend SDK** to authenticate shopper${operationData.phone ? ` with phone: ${operationData.phone}` : ''}\n\n💡 **Smart Authentication:**\n• Using stored challenge ID from previous lookup\n• No need to provide challenge ID manually\n\n💡 **What happens next:**\n1. Authentication component will be displayed\n2. Shopper enters their verification code\n3. Once authenticated, you can show payment options`;
          }
          
          metadata = { 
            skipifyAction: 'auth', 
            parameters: operationData,
            intent: intentAnalysis,
            executeSDK: true
          };
          break;

        case 'carousel':
          const amount = operationData.amount || 1000;
          responseContent = `💳 **Displaying payment carousel for $${(amount / 100).toFixed(2)}...**\n\n⏳ **Using frontend SDK** to show available payment methods.\n\n💡 **What happens next:**\n1. Payment carousel will be displayed\n2. Shopper can select their preferred payment method\n3. Complete the checkout process`;
          
          metadata = { 
            skipifyAction: 'carousel', 
            parameters: operationData,
            intent: intentAnalysis,
            executeSDK: true
          };
          break;

        case 'card_selection':
          const { cardIndex, cardType, cardEnding } = operationData;
          
          responseContent = `💳 **Selecting payment method...**\n\n`;
          
          if (cardIndex && cardType && cardEnding) {
            responseContent += `🎯 **Looking for:** ${cardType} card at position ${cardIndex} ending in ${cardEnding}\n\n`;
          } else if (cardIndex && cardType) {
            responseContent += `🎯 **Looking for:** ${cardType} card at position ${cardIndex}\n\n`;
          } else if (cardIndex && cardEnding) {
            responseContent += `🎯 **Looking for:** Payment method at position ${cardIndex} ending in ${cardEnding}\n\n`;
          } else if (cardType && cardEnding) {
            responseContent += `🎯 **Looking for:** ${cardType} card ending in ${cardEnding}\n\n`;
          } else if (cardIndex) {
            responseContent += `🎯 **Selecting:** Payment method at position ${cardIndex}\n\n`;
          } else if (cardType) {
            responseContent += `🎯 **Looking for:** ${cardType} card\n\n`;
          } else if (cardEnding) {
            responseContent += `🎯 **Looking for:** Card ending in ${cardEnding}\n\n`;
          } else {
            responseContent += `🎯 **Selecting:** Available payment method\n\n`;
          }
          
          responseContent += `💡 **What happens next:**\n1. I'll scan the available payment methods from the carousel\n2. Select the requested payment method if available\n3. Provide confirmation and proceed with checkout\n\n⚠️ **Note:** Make sure the payment carousel is currently displayed!`;
          
          metadata = { 
            skipifyAction: 'card_selection', 
            parameters: operationData,
            intent: intentAnalysis,
            executeSDK: true
          };
          break;

        case 'device_id':
          responseContent = `📱 **Getting device ID...**\n\n⏳ **Using frontend SDK** to retrieve the unique device identifier.\n\n💡 **Device ID helps:**\n- Identify returning shoppers\n- Provide personalized experiences\n- Enhance security and fraud prevention`;
          
          metadata = { 
            skipifyAction: 'device_id', 
            parameters: {},
            intent: intentAnalysis,
            executeSDK: true
          };
          break;
      }
    } else if (operation === 'help' || intentAnalysis.intent === 'help') {
      // Enhanced help response
      responseContent = `🚀 **Skipify Chat Assistant** - I can understand natural language and automatically perform Skipify operations!

💡 **Smart Commands You Can Try:**

🔍 **Payment Method Checks:**
• "Are there any payment methods for nick.suess@skipify.com?"
• "Does test@example.com have payment methods?"
• "Check if user@domain.com has saved payments"

🔐 **Authentication:**
• "Authenticate the shopper" *(uses stored challenge ID from lookup)*
• "Start authentication" *(automatic after lookup)*
• "Authenticate with challenge ID abc-123-def" *(manual override)*
• "Verify shopper with phone (555) 123-4567"

💳 **Payment Carousel:**
• "Show payment options for $25"
• "Display checkout for $50.99"
• "Payment carousel for $100"

📱 **Device ID:**
• "Get device ID"
• "What's the device identifier?"

🎯 **Card Selection:** *(After showing payment carousel)*
• "Select card 1" or "Choose the first payment method"
• "Use the second card" or "Pick card 2"
• "Select the last payment method"
• "Use my Visa card" or "Choose the Mastercard"
• "Select the PayPal option"

🎯 **Smart Features:**
✅ Automatic email/phone extraction from messages
✅ Natural language intent recognition  
✅ Automatic parameter detection
✅ Contextual responses with next steps

Just ask me in plain English - I'll figure out what you want to do! 🤖`;

      metadata = { intent: intentAnalysis };
    } else {
      // Generate general response based on user message or detected intent
      if (intentAnalysis.confidence > 0.5) {
        // We detected an intent but couldn't execute it
        if (intentAnalysis.intent === 'lookup' && intentAnalysis.parameters.email) {
          responseContent = `🔍 I understand you want to check for payment methods for **${intentAnalysis.parameters.email}**, but I need a valid session to perform this lookup.\n\n🎯 **To proceed:**\n1. Make sure you have a merchant ID configured\n2. Try asking: "Are there payment methods for ${intentAnalysis.parameters.email}?"`;
        } else if (intentAnalysis.intent === 'lookup') {
          responseContent = `🔍 I detected you want to perform a lookup, but I need an email or phone number.\n\n🎯 **Try asking:**\n• "Are there payment methods for user@example.com?"\n• "Check payment methods for (555) 123-4567"`;
        } else {
          responseContent = `🤖 I detected you want to: **${intentAnalysis.description}**\n\nBut I need a valid Skipify session to perform this operation. Please make sure your session is properly configured with a merchant ID.`;
        }
        
        metadata = { intent: intentAnalysis, needsSession: true };
      } else {
        // General conversation
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
          responseContent = 'Hello! 👋 I\'m your intelligent Skipify assistant. I can understand natural language and automatically perform Skipify operations.\n\n💡 Try asking: "Are there payment methods for test@example.com?" or type "help" for more examples!';
        } else if (lowerMessage.includes('test') || lowerMessage.includes('demo')) {
          responseContent = 'Great! You can test Skipify in several ways:\n\n🗣️ **Natural Language**: "Are there payment methods for user@example.com?"\n🖥️ **Test Interface**: Visit `/test` for manual testing\n🤖 **Chat Commands**: I can understand and execute operations automatically\n\n What would you like to try?';
        } else {
          responseContent = `🤖 I'm your intelligent Skipify assistant! I can understand natural language and automatically perform operations.\n\n💡 **Try asking:**\n• "Are there payment methods for email@example.com?"\n• "Show payment options for $25"\n• "Get device ID"\n\nOr type **"help"** for more examples!`;
        }
        
        metadata = { intent: intentAnalysis };
      }
    }

    return {
      id: uuidv4(),
      type: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      metadata,
    };
  }

  /**
   * Get chat statistics
   */
  getStats() {
    const totalSessions = this.sessions.size;
    const totalMessages = Array.from(this.sessions.values()).reduce((sum, session) => sum + session.messages.length, 0);
    const activeSessions = Array.from(this.sessions.values()).filter(session => 
      new Date().getTime() - session.updatedAt.getTime() < 30 * 60 * 1000 // 30 minutes
    ).length;

    return {
      totalSessions,
      totalMessages,
      activeSessions,
      skipifyClients: this.skipifyClients.size,
    };
  }
} 