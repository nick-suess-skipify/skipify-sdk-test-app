import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Store for chat sessions (in production, use a database)
const chatSessions = new Map();
const chatMessages = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Chat endpoints
app.post('/api/chat/sessions', (req, res) => {
    const sessionId = uuidv4();
    const session = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    chatSessions.set(sessionId, session);
    chatMessages.set(sessionId, []);
    
    res.json(session);
});

app.post('/api/chat/messages', (req, res) => {
    const { sessionId, message, role = 'user' } = req.body;
    
    if (!sessionId || !chatSessions.has(sessionId)) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const messages = chatMessages.get(sessionId) || [];
    const newMessage = {
        id: uuidv4(),
        role,
        content: message,
        timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    chatMessages.set(sessionId, messages);
    
    // Simple response logic for demo
    let response = "I'd be happy to help you with your checkout!";
    
    if (message.toLowerCase().includes('checkout') && message.includes('@')) {
        const email = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
        if (email) {
            response = {
                intent: 'lookup',
                skipifyOperation: 'lookup',
                contact: email,
                response: `✅ **Skipify account found!**

👤 **Account Details:**
• Email: ${email}
• Payment Methods: ✅ Available

🔐 **Authentication required - please follow the prompts to authenticate on the website**`
            };
        }
    } else if (message.toLowerCase().includes('help')) {
        response = `🛍️ **Welcome to Skipify Checkout!**

I can help you complete your purchase quickly and securely.

**Try saying:**
• *"Checkout with your-email@example.com"*
• *"Process my order with my email"*
• *"Pay with my Skipify account"*`;
    }
    
    const assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
    };
    
    messages.push(assistantMessage);
    chatMessages.set(sessionId, messages);
    
    res.json(assistantMessage);
});

app.get('/api/chat/sessions/:sessionId/messages', (req, res) => {
    const { sessionId } = req.params;
    const messages = chatMessages.get(sessionId) || [];
    res.json(messages);
});

// Skipify API proxy endpoints
app.post('/api/skipify/payments', (req, res) => {
    // Mock payment processing for demo
    const paymentId = uuidv4();
    
    res.json({
        success: true,
        paymentId,
        status: 'completed',
        receipt: {
            id: `receipt_${Date.now()}`,
            amount: req.body.amount || 0,
            currency: 'USD',
            timestamp: new Date().toISOString()
        }
    });
});

// Chat stats endpoint
app.get('/api/chat/stats', (req, res) => {
    res.json({
        totalSessions: chatSessions.size,
        totalMessages: Array.from(chatMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
        activeConnections: 0,
        uptime: process.uptime()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Skipify T-Shirt Store Demo running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🛍️ Demo: http://localhost:${PORT}/tshirt-store.html`);
});
