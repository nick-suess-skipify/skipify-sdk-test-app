# Skipify MCP Server

A Model Context Protocol (MCP) server for testing and deploying the Skipify Checkout SDK with embedded components. This server provides tools for SDK deployment, testing, and interactive chat functionality.

## Features

- 🚀 **MCP Protocol Support** - Full Model Context Protocol implementation
- 💳 **Skipify SDK Integration** - Direct integration with Skipify staging environment
- 💬 **Interactive Chat** - Real-time chat interface for SDK testing
- 🧪 **Test Interface** - Web-based testing interface for all SDK operations
- 🔧 **Deployment Tools** - Tools for deploying SDK to different platforms
- 📊 **Analytics** - Chat session statistics and monitoring

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Skipify merchant ID (provided: `ca4d3697-4579-4dda-9c89-ee63ae5a7b41`)

### Installation

1. **Clone and navigate to the MCP server directory:**
   ```bash
   cd mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` with the following endpoints:
- **Home**: `http://localhost:3000/`
- **Test Page**: `http://localhost:3000/test`
- **Chat Interface**: `http://localhost:3000/chat/[session-id]`

## MCP Tools

The server provides the following MCP tools:

### 1. `deploy_skipify_sdk`
Deploy the Skipify Checkout SDK for testing and integration.

**Parameters:**
- `environment` (string): Target environment (`dev`, `stage`, `prod`) - default: `stage`
- `merchantId` (string): Skipify merchant ID (required)
- `platform` (string): Target platform (`bigcommerce`, `shopify`, `custom`, `embedded-components`) - default: `embedded-components`

**Example:**
```json
{
  "environment": "stage",
  "merchantId": "ca4d3697-4579-4dda-9c89-ee63ae5a7b41",
  "platform": "embedded-components"
}
```

### 2. `test_skipify_sdk`
Test Skipify SDK functionality with various operations.

**Parameters:**
- `sessionId` (string): Chat session ID for the test (required)
- `testType` (string): Type of test (`lookup`, `auth`, `carousel`, `full-flow`) (required)
- `testData` (object): Additional test data for the operation

**Example:**
```json
{
  "sessionId": "session-123",
  "testType": "lookup",
  "testData": {
    "email": "test@example.com"
  }
}
```

### 3. `create_chat_session`
Create a new chat session for Skipify SDK testing.

**Parameters:**
- `merchantId` (string): Skipify merchant ID for the session
- `initialMessage` (string): Initial message to start the conversation

**Example:**
```json
{
  "merchantId": "ca4d3697-4579-4dda-9c89-ee63ae5a7b41",
  "initialMessage": "Hello! I want to test the Skipify SDK"
}
```

### 4. `send_chat_message`
Send a message in a chat session with optional Skipify operations.

**Parameters:**
- `sessionId` (string): Chat session ID (required)
- `message` (string): Message content (required)
- `skipifyOperation` (string): Skipify operation (`lookup`, `auth`, `carousel`, `none`) - default: `none`
- `skipifyData` (object): Data for the Skipify operation

**Example:**
```json
{
  "sessionId": "session-123",
  "message": "Lookup shopper with email test@example.com",
  "skipifyOperation": "lookup",
  "skipifyData": {
    "email": "test@example.com"
  }
}
```

### 5. `get_chat_sessions`
Get all active chat sessions.

**Parameters:** None

### 6. `get_chat_stats`
Get chat service statistics.

**Parameters:** None

## API Endpoints

### Chat API

- `POST /api/chat/sessions` - Create a new chat session
- `POST /api/chat/messages` - Send a message in a chat session
- `GET /api/chat/sessions` - List all chat sessions
- `GET /api/chat/stats` - Get chat service statistics

### Skipify API

- `POST /api/skipify/lookup` - Perform shopper lookup
- `POST /api/skipify/auth` - Authenticate shopper
- `POST /api/skipify/carousel` - Show payment carousel
- `GET /api/skipify/device-id` - Get device ID

## Skipify SDK Operations

### Shopper Lookup
Look up a shopper by email or phone number.

```javascript
// Example API call
fetch('/api/skipify/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    phone: '+1234567890'
  })
});
```

### Authentication
Authenticate a shopper using a challenge ID from lookup.

```javascript
// Example API call
fetch('/api/skipify/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challengeId: 'challenge-123',
    phone: '+1234567890'
  })
});
```

### Payment Carousel
Show available payment methods for a given amount.

```javascript
// Example API call
fetch('/api/skipify/carousel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000, // $10.00 in cents
    phone: '+1234567890'
  })
});
```

## Environment Configuration

The server uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `ENABLE_CORS` | Enable CORS | `true` |
| `SKIPIFY_MERCHANT_ID` | Skipify merchant ID | `ca4d3697-4579-4dda-9c89-ee63ae5a7b41` |
| `SKIPIFY_ENVIRONMENT` | Skipify environment | `stage` |

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Testing

The server includes a comprehensive test interface at `http://localhost:3000/test` that allows you to:

- Test shopper lookup
- Test authentication
- Test payment carousel
- Get device ID
- View SDK configuration

## Skipify Staging Environment

This server is configured to work with the Skipify staging environment:

- **Base URL**: `https://checkout.staging.skipify.com`
- **Components URL**: `https://checkout.staging.skipify.com/components/{merchantId}`
- **SDK URL**: `https://stagecdn.skipify.com/sdk`

## Chat Interface

The chat interface provides an interactive way to test Skipify operations:

1. **Create a session**: Use the `create_chat_session` tool or visit `/api/chat/sessions`
2. **Start chatting**: Visit `/chat/{sessionId}` to access the chat interface
3. **Test operations**: Send messages with Skipify operations like:
   - "Lookup shopper with email test@example.com"
   - "Authenticate with challenge ID abc123"
   - "Show carousel for $50"

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the `PORT` environment variable
2. **CORS errors**: Ensure `ENABLE_CORS=true` in your environment
3. **Skipify API errors**: Verify your merchant ID and environment settings
4. **MCP connection issues**: Check that the MCP client is properly configured

### Logs

The server provides detailed logging for debugging:

- MCP server startup logs
- Express server logs
- Skipify API request/response logs
- Chat session logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:
- **Skipify SDK**: Contact Skipify support
- **MCP Server**: Open an issue in this repository
- **General questions**: Check the documentation or create a discussion 