# Skipify Checkout SDK - MCP Server & Test Chat Application

This project provides a complete testing and deployment solution for the Skipify Checkout SDK with embedded components, including a Model Context Protocol (MCP) server and a modern React-based test chat application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Skipify merchant ID (provided: `ca4d3697-4579-4dda-9c89-ee63ae5a7b41`)

### Automated Setup

Run the setup script to install all dependencies and build both applications:

```bash
./setup.sh
```

### Manual Setup

If you prefer to set up manually:

1. **Setup MCP Server:**
   ```bash
   cd mcp-server
   npm install
   npm run build
   cp env.example .env
   ```

2. **Setup Test Chat App:**
   ```bash
   cd test-chat-app
   npm install
   ```

3. **Start the applications:**
   ```bash
   # Terminal 1 - Start MCP Server
   cd mcp-server
   npm start
   
   # Terminal 2 - Start Test Chat App
   cd test-chat-app
   npm run dev
   ```

## 📁 Project Structure

```
├── mcp-server/                 # MCP Server implementation
│   ├── src/
│   │   ├── index.ts           # Main MCP server
│   │   ├── types.ts           # TypeScript types
│   │   ├── skipify-client.ts  # Skipify SDK client
│   │   └── chat-service.ts    # Chat functionality
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── test-chat-app/             # React test chat application
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   ├── main.tsx          # React entry point
│   │   └── index.css         # Styles
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── setup.sh                   # Automated setup script
└── README.md                  # This file
```

## 🌐 Application URLs

Once running, access the applications at:

- **MCP Server Home**: http://localhost:3000
- **MCP Server Test Page**: http://localhost:3000/test
- **Test Chat App**: http://localhost:3001
- **Chat Interface**: http://localhost:3000/chat/[session-id]

## 🔧 MCP Server Features

### MCP Tools Available

1. **`deploy_skipify_sdk`** - Deploy Skipify SDK for testing
2. **`test_skipify_sdk`** - Test SDK functionality
3. **`create_chat_session`** - Create new chat session
4. **`send_chat_message`** - Send messages with Skipify operations
5. **`get_chat_sessions`** - List active sessions
6. **`get_chat_stats`** - Get service statistics

### API Endpoints

#### Chat API
- `POST /api/chat/sessions` - Create chat session
- `POST /api/chat/messages` - Send message
- `GET /api/chat/sessions` - List sessions
- `GET /api/chat/stats` - Get statistics

#### Skipify API
- `POST /api/skipify/lookup` - Shopper lookup
- `POST /api/skipify/auth` - Authentication
- `POST /api/skipify/carousel` - Payment carousel
- `GET /api/skipify/device-id` - Device ID

## 💬 Test Chat Application

The React-based test chat application provides:

- **Interactive Chat Interface** - Real-time messaging with Skipify operations
- **SDK Controls** - Direct testing of Skipify SDK functions
- **Result Display** - Real-time display of API responses
- **Session Management** - Create and manage chat sessions

### Features

- Modern React 18 with TypeScript
- Real-time chat with Skipify integration
- Direct SDK operation testing
- Beautiful, responsive UI
- Error handling and loading states

## 🎯 Skipify SDK Integration

### Supported Operations

1. **Shopper Lookup**
   ```javascript
   // Look up shopper by email or phone
   POST /api/skipify/lookup
   {
     "email": "test@example.com",
     "phone": "+1234567890"
   }
   ```

2. **Authentication**
   ```javascript
   // Authenticate shopper with challenge ID
   POST /api/skipify/auth
   {
     "challengeId": "challenge-123",
     "phone": "+1234567890"
   }
   ```

3. **Payment Carousel**
   ```javascript
   // Show payment methods for amount
   POST /api/skipify/carousel
   {
     "amount": 1000, // $10.00 in cents
     "phone": "+1234567890"
   }
   ```

4. **Device ID**
   ```javascript
   // Get device identification
   GET /api/skipify/device-id
   ```

### Staging Environment

The server is configured for Skipify staging environment:

- **Base URL**: `https://checkout.staging.skipify.com`
- **Components URL**: `https://checkout.staging.skipify.com/components/{merchantId}`
- **SDK URL**: `https://stagecdn.skipify.com/sdk`

## 🛠️ Development

### Environment Variables

Create a `.env` file in the `mcp-server` directory:

```env
# Server Configuration
PORT=3000
ENABLE_CORS=true

# Skipify Configuration
SKIPIFY_MERCHANT_ID=ca4d3697-4579-4dda-9c89-ee63ae5a7b41
SKIPIFY_ENVIRONMENT=stage
```

### Development Commands

#### MCP Server
```bash
cd mcp-server
npm run dev      # Development mode with hot reload
npm run build    # Build for production
npm start        # Start production server
```

#### Test Chat App
```bash
cd test-chat-app
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🧪 Testing

### Manual Testing

1. **Start both applications** (see Quick Start)
2. **Visit the test page**: http://localhost:3000/test
3. **Use the chat interface**: http://localhost:3001
4. **Test Skipify operations** through the UI controls

### MCP Tool Testing

Use any MCP-compatible client to test the tools:

```json
{
  "name": "create_chat_session",
  "arguments": {
    "merchantId": "ca4d3697-4579-4dda-9c89-ee63ae5a7b41",
    "initialMessage": "Hello! I want to test the Skipify SDK"
  }
}
```

### API Testing

Test the REST API endpoints directly:

```bash
# Create a chat session
curl -X POST http://localhost:3000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "ca4d3697-4579-4dda-9c89-ee63ae5a7b41"}'

# Test shopper lookup
curl -X POST http://localhost:3000/api/skipify/lookup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change `PORT` in `.env` file
   - Kill existing processes: `lsof -ti:3000 | xargs kill`

2. **CORS errors**
   - Ensure `ENABLE_CORS=true` in environment
   - Check browser console for specific errors

3. **Skipify API errors**
   - Verify merchant ID is correct
   - Check network connectivity
   - Ensure staging environment is accessible

4. **MCP connection issues**
   - Verify MCP client configuration
   - Check server logs for errors
   - Ensure proper transport setup

### Logs

Both applications provide detailed logging:

- **MCP Server**: Console output with request/response logs
- **Test Chat App**: Browser console and network tab
- **Skipify API**: Detailed error messages in responses

## 📚 Documentation

- [MCP Server README](mcp-server/README.md) - Detailed MCP server documentation
- [Skipify SDK Documentation](https://docs.skipify.com) - Official Skipify documentation
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues related to:
- **Skipify SDK**: Contact Skipify support
- **MCP Server**: Open an issue in this repository
- **Test Chat App**: Open an issue in this repository
- **General questions**: Check the documentation or create a discussion

## 🎉 Getting Started Examples

### Example 1: Quick SDK Test

1. Start the MCP server: `cd mcp-server && npm start`
2. Visit: http://localhost:3000/test
3. Enter test data and click "Test Lookup"
4. View results in real-time

### Example 2: Interactive Chat

1. Start both applications
2. Visit: http://localhost:3001
3. Create a chat session
4. Send messages like "lookup shopper with email test@example.com"
5. Watch the AI respond with Skipify operations

### Example 3: MCP Tool Usage

1. Connect an MCP client to the server
2. Use the `deploy_skipify_sdk` tool
3. Use the `create_chat_session` tool
4. Send messages with Skipify operations

This project provides a complete ecosystem for testing and deploying the Skipify Checkout SDK with modern tooling and interactive interfaces.
