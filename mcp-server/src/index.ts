import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

import { ChatService } from './chat-service.js';
import { SkipifyClient } from './skipify-client.js';
import { 
  DeploySDKSchema, 
  TestSDKSchema, 
  CreateChatSessionSchema, 
  SendChatMessageSchema,
  ServerConfigSchema 
} from './types.js';

class SkipifyMCPServer {
  private server: Server;
  private chatService: ChatService;
  private expressApp: express.Application;
  private wsServer: WebSocketServer | null = null;
  private config: any;

  constructor() {
    this.server = new Server(
      {
        name: 'skipify-mcp-server',
        version: '1.0.0',
      }
    );

    this.chatService = new ChatService();
    this.expressApp = express();
    this.config = ServerConfigSchema.parse({
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
      skipifyMerchantId: process.env.SKIPIFY_MERCHANT_ID || '1bdc8b60-6dd4-4126-88e1-c9e5b570f1a0',
      skipifyApiKey: process.env.SKIPIFY_API_KEY,
      skipifyEnvironment: (process.env.SKIPIFY_ENVIRONMENT as 'dev' | 'stage' | 'prod') || 'stage',
      enableCors: process.env.ENABLE_CORS !== 'false',
    });

    this.setupMCPServer();
    this.setupExpressServer();
  }

  private setupMCPServer() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'deploy_skipify_sdk',
            description: 'Deploy the Skipify Checkout SDK for testing and integration',
            inputSchema: {
              type: 'object',
              properties: {
                environment: {
                  type: 'string',
                  enum: ['dev', 'stage', 'prod'],
                  description: 'Target environment for deployment',
                  default: 'stage',
                },
                merchantId: {
                  type: 'string',
                  description: 'Skipify merchant ID for the deployment',
                },
                platform: {
                  type: 'string',
                  enum: ['bigcommerce', 'shopify', 'custom', 'embedded-components'],
                  description: 'Target platform for SDK deployment',
                  default: 'embedded-components',
                },
              },
              required: ['merchantId'],
            },
          },
          {
            name: 'test_skipify_sdk',
            description: 'Test Skipify SDK functionality with various operations',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Chat session ID for the test',
                },
                testType: {
                  type: 'string',
                  enum: ['lookup', 'auth', 'carousel', 'full-flow'],
                  description: 'Type of test to perform',
                },
                testData: {
                  type: 'object',
                  description: 'Additional test data for the operation',
                },
              },
              required: ['sessionId', 'testType'],
            },
          },
          {
            name: 'create_chat_session',
            description: 'Create a new chat session for Skipify SDK testing',
            inputSchema: {
              type: 'object',
              properties: {
                merchantId: {
                  type: 'string',
                  description: 'Skipify merchant ID for the session',
                },
                initialMessage: {
                  type: 'string',
                  description: 'Initial message to start the conversation',
                },
              },
            },
          },
          {
            name: 'send_chat_message',
            description: 'Send a message in a chat session with optional Skipify operations',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Chat session ID',
                },
                message: {
                  type: 'string',
                  description: 'Message content',
                },
                skipifyOperation: {
                  type: 'string',
                  enum: ['lookup', 'auth', 'carousel', 'none'],
                  description: 'Skipify operation to perform with the message',
                  default: 'none',
                },
                skipifyData: {
                  type: 'object',
                  description: 'Data for the Skipify operation',
                },
              },
              required: ['sessionId', 'message'],
            },
          },
          {
            name: 'get_chat_sessions',
            description: 'Get all active chat sessions',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_chat_stats',
            description: 'Get chat service statistics',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ] as Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'deploy_skipify_sdk': {
            const validatedArgs = DeploySDKSchema.parse(args);
            const skipifyClient = new SkipifyClient(validatedArgs.merchantId, validatedArgs.environment);
            await skipifyClient.initializeSession();
            
            const testPage = skipifyClient.generateTestPage();
            const sdkConfig = skipifyClient.getSDKConfig();
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Skipify SDK deployed successfully!\n\n**Deployment Details:**\n- Environment: ${validatedArgs.environment}\n- Merchant ID: ${validatedArgs.merchantId}\n- Platform: ${validatedArgs.platform}\n- Session ID: ${skipifyClient.getSessionId()}\n\n**Test Page:**\nVisit http://localhost:${this.config.port}/test to test the SDK\n\n**SDK Configuration:**\n\`\`\`json\n${JSON.stringify(sdkConfig, null, 2)}\n\`\`\``,
                },
              ],
            };
          }

          case 'test_skipify_sdk': {
            const validatedArgs = TestSDKSchema.parse(args);
            const session = this.chatService.getSession(validatedArgs.sessionId);
            
            if (!session) {
              throw new Error('Chat session not found');
            }

            const skipifyClient = this.chatService.getSkipifyClient(validatedArgs.sessionId);
            if (!skipifyClient) {
              throw new Error('Skipify client not available for this session');
            }

            let testResult = '';
            switch (validatedArgs.testType) {
              case 'lookup':
                const lookupData = validatedArgs.testData as { email?: string; phone?: string } || { email: 'test@example.com' };
                const lookupResult = await skipifyClient.lookupShopper(lookupData);
                testResult = `✅ Lookup test completed!\n\n**Results:**\n- Challenge ID: ${lookupResult.challengeId}\n- Flags: ${JSON.stringify(lookupResult.flags, null, 2)}`;
                break;
              
              case 'auth':
                if (!validatedArgs.testData?.challengeId) {
                  throw new Error('Challenge ID required for auth test');
                }
                const authResult = await skipifyClient.authenticateShopper(validatedArgs.testData as { challengeId: string });
                testResult = `✅ Authentication test completed!\n\n**Results:**\n- Shopper ID: ${authResult.shopperId}\n- Session ID: ${authResult.sessionId}`;
                break;
              
              case 'carousel':
                const carouselData = validatedArgs.testData as { amount: number } || { amount: 1000 };
                const carouselResult = await skipifyClient.showCarousel(carouselData);
                testResult = `✅ Carousel test completed!\n\n**Results:**\n- Payment ID: ${carouselResult.paymentId || 'None'}\n- Session ID: ${carouselResult.sessionId || 'None'}`;
                break;
              
              case 'full-flow':
                const email = (validatedArgs.testData as { email?: string })?.email || 'test@example.com';
                const lookup = await skipifyClient.lookupShopper({ email });
                const auth = await skipifyClient.authenticateShopper({ challengeId: lookup.challengeId });
                const carousel = await skipifyClient.showCarousel({ amount: 1000 });
                testResult = `✅ Full flow test completed!\n\n**Results:**\n1. **Lookup**: Challenge ID ${lookup.challengeId}\n2. **Auth**: Shopper ID ${auth.shopperId}\n3. **Carousel**: Payment ID ${carousel.paymentId || 'None'}`;
                break;
            }

            return {
              content: [
                {
                  type: 'text',
                  text: testResult,
                },
              ],
            };
          }

          case 'create_chat_session': {
            const validatedArgs = CreateChatSessionSchema.parse(args);
            const session = await this.chatService.createSession(validatedArgs);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Chat session created successfully!\n\n**Session Details:**\n- Session ID: ${session.id}\n- Merchant ID: ${session.merchantId || 'None'}\n- Skipify Session ID: ${session.skipifySessionId || 'None'}\n- Created: ${session.createdAt.toISOString()}\n\n**Chat Interface:**\nVisit http://localhost:${this.config.port}/chat/${session.id} to start chatting`,
                },
              ],
            };
          }

          case 'send_chat_message': {
            const validatedArgs = SendChatMessageSchema.parse(args);
            const response = await this.chatService.sendMessage(validatedArgs);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `💬 Message sent successfully!\n\n**Response:**\n${response.content}`,
                },
              ],
            };
          }

          case 'get_chat_sessions': {
            const sessions = this.chatService.getAllSessions();
            
            const sessionsList = sessions.map(session => 
              `- **${session.id}** (${session.messages.length} messages, ${session.merchantId || 'no merchant'})`
            ).join('\n');
            
            return {
              content: [
                {
                  type: 'text',
                  text: `📋 Active Chat Sessions (${sessions.length}):\n\n${sessionsList || 'No active sessions'}`,
                },
              ],
            };
          }

          case 'get_chat_stats': {
            const stats = this.chatService.getStats();
            
            return {
              content: [
                {
                  type: 'text',
                  text: `📊 Chat Service Statistics:\n\n- Total Sessions: ${stats.totalSessions}\n- Total Messages: ${stats.totalMessages}\n- Active Sessions: ${stats.activeSessions}\n- Skipify Clients: ${stats.skipifyClients}`,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private setupExpressServer() {
    // Middleware
    if (this.config.enableCors) {
      this.expressApp.use(cors());
    }
    this.expressApp.use(express.json());

    // Routes
    this.expressApp.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Skipify MCP Server</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .method { color: #007bff; font-weight: bold; }
            .url { color: #28a745; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1>🚀 Skipify MCP Server</h1>
          <p>Welcome to the Skipify Checkout SDK MCP Server! This server provides tools for testing and deploying Skipify checkout functionality.</p>
          
          <h2>Available Endpoints:</h2>
          <div class="endpoint">
            <span class="method">GET</span> <span class="url">/</span> - This page
          </div>
          <div class="endpoint">
            <span class="method">GET</span> <span class="url">/test</span> - Skipify SDK test page
          </div>
          <div class="endpoint">
            <span class="method">GET</span> <span class="url">/chat/:sessionId</span> - Chat interface
          </div>
          <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/chat/sessions</span> - Create chat session
          </div>
          <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/chat/messages</span> - Send chat message
          </div>
          <div class="endpoint">
            <span class="method">GET</span> <span class="url">/api/chat/sessions</span> - List chat sessions
          </div>
          <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/skipify/lookup</span> - Shopper lookup
          </div>
          <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/skipify/auth</span> - Shopper authentication
          </div>
          <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/skipify/carousel</span> - Payment carousel
          </div>
          <div class="endpoint">
            <span class="method">GET</span> <span class="url">/api/skipify/device-id</span> - Get device ID
          </div>
          <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/skipify/payments</span> - Submit payment
          </div>
          
          <h2>Quick Start:</h2>
          <ol>
            <li>Visit <a href="/test">/test</a> to test the Skipify SDK</li>
            <li>Create a chat session at <a href="/api/chat/sessions">/api/chat/sessions</a></li>
            <li>Use the MCP tools for deployment and testing</li>
          </ol>
        </body>
        </html>
      `);
    });

    // Test page
    this.expressApp.get('/test', (req, res) => {
      const skipifyClient = new SkipifyClient(this.config.skipifyMerchantId, this.config.skipifyEnvironment);
      skipifyClient.initializeSession().then(() => {
        const testPage = skipifyClient.generateTestPage();
        res.send(testPage);
      });
    });

    // Chat interface
    this.expressApp.get('/chat/:sessionId', (req, res) => {
      const sessionId = req.params.sessionId;
      const session = this.chatService.getSession(sessionId);
      
      if (!session) {
        return res.status(404).send('Chat session not found');
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Skipify Chat - ${sessionId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .chat-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .chat-header { padding: 20px; border-bottom: 1px solid #eee; }
            .chat-messages { height: 400px; overflow-y: auto; padding: 20px; }
            .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
            .message.user { background: #007bff; color: white; margin-left: 20%; }
            .message.assistant { background: #f8f9fa; margin-right: 20%; }
            .message.system { background: #ffc107; color: #212529; font-style: italic; }
            .chat-input { padding: 20px; border-top: 1px solid #eee; }
            .chat-input input { width: 70%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .chat-input button { width: 25%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
            .chat-input button:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="chat-container">
            <div class="chat-header">
              <h2>Skipify Chat Session</h2>
              <p>Session ID: ${sessionId}</p>
              <p>Merchant ID: ${session.merchantId || 'None'}</p>
            </div>
            <div class="chat-messages" id="messages">
              ${session.messages.map(msg => `
                <div class="message ${msg.type}">
                  <strong>${msg.type.toUpperCase()}:</strong> ${msg.content}
                </div>
              `).join('')}
            </div>
            <div class="chat-input">
              <input type="text" id="messageInput" placeholder="Type your message..." onkeypress="if(event.key==='Enter') sendMessage()">
              <button onclick="sendMessage()">Send</button>
            </div>
          </div>
          
          <script>
            function sendMessage() {
              const input = document.getElementById('messageInput');
              const message = input.value.trim();
              if (!message) return;
              
              fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: '${sessionId}',
                  message: message
                })
              })
              .then(response => response.json())
              .then(data => {
                location.reload();
              })
              .catch(error => {
                console.error('Error:', error);
                alert('Error sending message');
              });
              
              input.value = '';
            }
            
            // Auto-scroll to bottom
            const messages = document.getElementById('messages');
            messages.scrollTop = messages.scrollHeight;
          </script>
        </body>
        </html>
      `);
    });

    // API Routes
    this.expressApp.post('/api/chat/sessions', async (req, res) => {
      try {
        const session = await this.chatService.createSession(req.body);
        res.json(session);
      } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.expressApp.post('/api/chat/messages', async (req, res) => {
      try {
        const response = await this.chatService.sendMessage(req.body);
        res.json(response);
      } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.expressApp.get('/api/chat/sessions', (req, res) => {
      const sessions = this.chatService.getAllSessions();
      res.json(sessions);
    });

    this.expressApp.get('/api/chat/stats', (req, res) => {
      const stats = this.chatService.getStats();
      res.json(stats);
    });

    // Skipify API Routes
    this.expressApp.post('/api/skipify/lookup', async (req, res) => {
      try {
        const skipifyClient = new SkipifyClient(
          this.config.skipifyMerchantId, 
          this.config.skipifyEnvironment,
          this.config.skipifyApiKey
        );
        const result = await skipifyClient.lookupShopper(req.body);
        
        // Generate a session ID for subsequent operations
        const sessionId = await skipifyClient.initializeSession();
        
        // Return both the lookup result and session info
        res.json({
          ...result,
          sessionId: sessionId,
          merchantId: this.config.skipifyMerchantId
        });
      } catch (error) {
        console.error('Lookup error:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.expressApp.post('/api/skipify/auth', async (req, res) => {
      try {
        const { sessionId, ...authData } = req.body;
        
        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID is required for authentication' });
        }
        
        const skipifyClient = new SkipifyClient(
          this.config.skipifyMerchantId, 
          this.config.skipifyEnvironment,
          this.config.skipifyApiKey
        );
        skipifyClient.setSessionId(sessionId);
        
        const result = await skipifyClient.authenticateShopper(authData);
        res.json({
          ...result,
          sessionId: sessionId
        });
      } catch (error) {
        console.error('Auth error:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.expressApp.post('/api/skipify/carousel', async (req, res) => {
      try {
        const { sessionId, ...carouselData } = req.body;
        
        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID is required for carousel' });
        }
        
        const skipifyClient = new SkipifyClient(
          this.config.skipifyMerchantId, 
          this.config.skipifyEnvironment,
          this.config.skipifyApiKey
        );
        skipifyClient.setSessionId(sessionId);
        
        const result = await skipifyClient.showCarousel(carouselData);
        res.json({
          ...result,
          sessionId: sessionId
        });
      } catch (error) {
        console.error('Carousel error:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.expressApp.get('/api/skipify/device-id', async (req, res) => {
      try {
        const sessionId = req.query.sessionId as string;
        
        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID is required for device ID' });
        }
        
        const skipifyClient = new SkipifyClient(
          this.config.skipifyMerchantId, 
          this.config.skipifyEnvironment,
          this.config.skipifyApiKey
        );
        skipifyClient.setSessionId(sessionId);
        
        const deviceId = await skipifyClient.getDeviceId();
        res.json({ 
          deviceId,
          sessionId: sessionId
        });
      } catch (error) {
        console.error('Device ID error:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Payment submission endpoint
    this.expressApp.post('/api/skipify/payments', async (req, res) => {
      try {
        const { paymentId, sessionId, amount, currencyCode, merchantReference } = req.body;
        
        // Validate required fields
        if (!paymentId || !sessionId || !amount) {
          return res.status(400).json({ 
            error: 'Missing required fields: paymentId, sessionId, amount' 
          });
        }

        console.log('🚀 Processing payment submission:', { paymentId, sessionId, amount, merchantReference });

        // Generate GUID for merchantReference
        const generateGUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        // Prepare payment data for Skipify API (exact structure required)
        const paymentData = {
          paymentId,
          sessionId,
          amount: Math.round(amount), // Ensure amount is in cents (integer)
          merchantReference: merchantReference || generateGUID(),
          enableRecurring: false
        };

        console.log('📦 Sending exact payload to Skipify:', JSON.stringify(paymentData, null, 2));

        // Generate unique idempotency key for this payment request
        const idempotencyKey = `${paymentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Use staging API key directly
        const apiKey = 'SKIP_&E8j,WO]yzfD|0zYDv!$1La_ldf;A,uUkHbWAs43OTq.U{K92-VuN=UxnIc';
        
        // Submit payment to Skipify API (correct staging endpoint)
        // Note: Temporarily bypass SSL verification for staging environment
        const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        
        try {
          const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `ApiKey ${apiKey}`,
            'X-Merchant-Id': this.config.skipifyMerchantId,
            'X-Idempotency-Key': idempotencyKey
          };

          console.log('🔗 Skipify API Request:');
          console.log('  URL: https://services.staging.skipify.com/payments');
          console.log('  Headers:', JSON.stringify(requestHeaders, null, 2));
          console.log('  Body:', JSON.stringify(paymentData));

          const response = await fetch('https://services.staging.skipify.com/payments', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(paymentData)
          });
          
          const result = await response.json();
          
          if (response.ok) {
            console.log('✅ Payment submission successful:', result);
            res.json({
              success: true,
              status: result.status || 'completed',
              transactionId: result.transactionId || paymentId,
              merchantReference: paymentData.merchantReference,
              amount: amount,
              currencyCode: currencyCode,
              ...result
            });
          } else {
            console.error('❌ Payment submission failed:', result);
            res.status(response.status).json({
              success: false,
              error: result.message || 'Payment submission failed',
              code: result.code,
              ...result
            });
          }
        } catch (fetchError) {
          console.error('💥 Fetch error:', fetchError);
          throw fetchError;
        } finally {
          // Always restore SSL verification
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        }

      } catch (error) {
        console.error('💥 Payment submission error:', error);
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : 'Payment processing failed' 
        });
      }
    });
  }

  async start() {
    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('MCP Server started');

    // Start Express server
    const httpServer = this.expressApp.listen(this.config.port, () => {
      console.log(`🚀 Skipify MCP Server running on http://localhost:${this.config.port}`);
      console.log(`📋 Test page: http://localhost:${this.config.port}/test`);
      console.log(`💬 Chat interface: http://localhost:${this.config.port}/chat/[session-id]`);
    });

    // Setup WebSocket for real-time chat
    this.wsServer = new WebSocketServer({ server: httpServer });
    this.wsServer.on('connection', (ws) => {
      console.log('WebSocket client connected');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          // Handle WebSocket messages if needed
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
    });
  }
}

// Start the server
const server = new SkipifyMCPServer();
server.start().catch(console.error); 