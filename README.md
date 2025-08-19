# 🛍️ Skipify T-Shirt Store Demo

An enhanced demonstration of the Skipify Checkout SDK featuring a complete e-commerce experience with chat-powered checkout functionality.

## 🌟 Features

- **🛒 Interactive Shopping Cart** - Add/remove premium T-shirts with real-time cart updates
- **💬 Chat-Powered Checkout** - AI assistant guides users through the payment process
- **🔐 Skipify SDK Integration** - Complete payment flow with authentication and payment carousel
- **💳 Payment Processing** - Real payment processing with receipt generation
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices
- **🎯 User-Friendly Interface** - Clean, modern design with excellent UX

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nick-suess-skipify/skipify-sdk-test-app.git
   cd skipify-sdk-test-app
   ```

2. **Install dependencies:**
   ```bash
   # Install frontend dependencies
   cd test-chat-app && npm install

   # Install backend dependencies  
   cd ../mcp-server && npm install
   ```

3. **Build the backend:**
   ```bash
   cd mcp-server && npm run build
   ```

### Running the Demo

1. **Start the backend server (Port 3000):**
   ```bash
   cd mcp-server && npm start
   ```

2. **Start the demo server (Port 8080):**
   ```bash
   cd test-chat-app && node serve-test.js
   ```

3. **Open the demo:**
   Visit [http://localhost:8080/tshirt-store.html](http://localhost:8080/tshirt-store.html)

## 💡 How to Use

1. **Browse Products** - View the premium T-shirt collection
2. **Add to Cart** - Click "Add to Cart" on products you like
3. **Start Checkout** - Click "💬 Chat to Checkout" when ready
4. **Follow Chat Instructions** - Use phrases like:
   - *"Checkout with your-email@example.com"*
   - *"Process my order with my email"*
   - *"Pay with my Skipify account"*
5. **Complete Payment** - Authenticate and select payment method
6. **Get Receipt** - View your order confirmation and receipt

## 🏗️ Architecture

### Frontend (`test-chat-app/`)
- **`tshirt-store.html`** - Main demo application
- **Skipify SDK Integration** - Dynamic SDK loading with retry mechanisms
- **Chat Interface** - Real-time messaging with payment assistance
- **Payment Components** - Authentication and payment carousel integration

### Backend (`mcp-server/`)
- **Express Server** - RESTful API for chat and payments
- **Chat Service** - AI-powered conversation handling
- **Skipify Client** - Payment processing integration
- **MCP Protocol** - Model Context Protocol for advanced integrations

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `mcp-server/` directory:

```bash
PORT=3000
SKIPIFY_MERCHANT_ID=1bdc8b60-6dd4-4126-88e1-c9e5b570f1a0
SKIPIFY_ENVIRONMENT=stage
ENABLE_CORS=true
```

### Skipify Configuration

The demo is pre-configured for the Skipify staging environment:
- **Merchant ID**: `1bdc8b60-6dd4-4126-88e1-c9e5b570f1a0`
- **Environment**: `stage`
- **SDK URL**: `https://stagecdn.skipify.com/sdk/components-sdk.js`

## 📖 Available Demos

- **🛍️ T-Shirt Store**: `http://localhost:8080/tshirt-store.html` (Main demo)
- **📋 Simple Test**: `http://localhost:8080/simple-test.html`
- **🔍 Debug Page**: `http://localhost:8080/debug-sdk.html`
- **🔧 Minimal Test**: `http://localhost:8080/minimal-test.html`
- **✅ Working Playground**: `http://localhost:8080/working-playground.html`

## 🛠️ Development

### Project Structure

```
├── test-chat-app/           # Frontend demo applications
│   ├── tshirt-store.html   # Main T-shirt store demo
│   ├── serve-test.js       # HTTP server for demos
│   └── src/                # React components
├── mcp-server/             # Backend API server
│   ├── src/                # TypeScript source code
│   │   ├── index.ts        # Main server entry point
│   │   ├── chat-service.ts # Chat handling logic
│   │   └── skipify-client.ts # Payment processing
│   └── dist/               # Compiled JavaScript
└── setup.sh               # Quick setup script
```

### API Endpoints

#### Chat API
- `POST /api/chat/sessions` - Create new chat session
- `POST /api/chat/messages` - Send chat message
- `GET /api/chat/sessions` - List chat sessions
- `GET /api/chat/stats` - Get chat statistics

#### Skipify API
- `POST /api/skipify/payments` - Process payments
- `POST /api/skipify/lookup` - Shopper lookup
- `GET /api/skipify/device-id` - Get device ID

## 🎯 Key Enhancements

### Payment Confirmation
- ✅ **Fixed card details display** - Shows proper card type and ending digits
- ✅ **Enhanced user messaging** - Clean, user-friendly chat responses
- ✅ **Generic email examples** - Uses placeholder emails in demos

### Chat Experience
- ✅ **Improved lookup responses** - Removes technical details like Challenge ID
- ✅ **Better authentication messaging** - Clear guidance for users
- ✅ **Error handling** - Comprehensive error messages and retry mechanisms

### User Interface
- ✅ **Modern design** - Beautiful gradient backgrounds and animations
- ✅ **Responsive layout** - Works on all screen sizes
- ✅ **Interactive elements** - Hover effects and smooth transitions

## 🧪 Testing

The demo includes comprehensive test coverage:

1. **SDK Loading** - Dynamic loading with fallback mechanisms
2. **Payment Flow** - Complete checkout process testing
3. **Error Handling** - Network failures and API errors
4. **Chat Integration** - AI-powered conversation testing
5. **Mobile Compatibility** - Responsive design validation

## 📚 Documentation

- **Skipify SDK**: [Official Documentation](https://docs.skipify.com)
- **Payment Integration**: See `mcp-server/README.md`
- **Chat Setup**: Detailed instructions in chat service files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For questions about this demo:
- Open an issue on GitHub
- Check the troubleshooting section in `mcp-server/README.md`

For Skipify SDK support:
- Visit [Skipify Documentation](https://docs.skipify.com)
- Contact Skipify Support

---

**🎉 Enjoy exploring the enhanced Skipify T-Shirt Store demo!**