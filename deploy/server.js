const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss');

const app = express();
const PORT = process.env.PORT || 8080;

// 🔐 SECURE: Environment Variables (NO FALLBACKS FOR PRODUCTION SECURITY)
const SKIPIFY_MERCHANT_ID = process.env.SKIPIFY_MERCHANT_ID;
const SKIPIFY_ENVIRONMENT = process.env.SKIPIFY_ENVIRONMENT || 'stage';
const SESSION_SECRET = process.env.SESSION_SECRET;

// 🚨 CRITICAL: Fail fast if required credentials are missing
if (!SKIPIFY_MERCHANT_ID) {
    console.error('🚨 CRITICAL ERROR: SKIPIFY_MERCHANT_ID environment variable is required');
    console.error('📋 Please set this in your deployment environment (Digital Ocean, Docker, etc.)');
    console.error('🔧 For local development, create a .env file with: SKIPIFY_MERCHANT_ID=your_merchant_id');
    process.exit(1);
}

if (!SESSION_SECRET) {
    console.error('🚨 CRITICAL ERROR: SESSION_SECRET environment variable is required');
    console.error('📋 Please set a secure random string in your deployment environment');
    console.error('🔧 For local development, create a .env file with: SESSION_SECRET=your_random_secret');
    process.exit(1);
}

console.log('✅ Security: All required environment variables loaded');
console.log(`📊 Merchant ID: ${SKIPIFY_MERCHANT_ID.substring(0, 8)}...(masked)`);
console.log(`🌍 Environment: ${SKIPIFY_ENVIRONMENT}`);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://stagecdn.skipify.com", "https://prodcdn.skipify.com"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://stagecdn.skipify.com", "https://prodcdn.skipify.com", "https://api.skipify.com", "https://checkout.staging.skipify.com", "https://checkout.skipify.com"],
            frameSrc: [
                "'self'", 
                "https://stagecdn.skipify.com", 
                "https://prodcdn.skipify.com",
                "https://checkout.staging.skipify.com",
                "https://checkout.skipify.com",
                "https://*.skipify.com" // Allow all skipify subdomains
            ]
        }
    },
    crossOriginEmbedderPolicy: false // Required for Skipify SDK
}));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 API calls per minute
    message: { error: 'API rate limit exceeded. Please wait before making more requests.' }
});

const paymentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit payment attempts
    message: { error: 'Payment rate limit exceeded for security. Please wait 5 minutes.' }
});

app.use(generalLimiter);

// Secure CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://skipify-tshirt-store-qbcx3.ondigitalocean.app',
    'https://skipify-tshirt-store-demo.ondigitalocean.app',
    // Add your production domains here
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files with security headers
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
        }
    }
}));

// Input validation helper
function validateInput(input, maxLength = 1000) {
    if (!input || typeof input !== 'string') return '';
    
    // Remove XSS attempts
    const cleaned = xss(input, {
        whiteList: {}, // No HTML allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    });
    
    // Limit length
    return cleaned.substring(0, maxLength).trim();
}

// Secure session storage (in production, use Redis or database)
const chatSessions = new Map();
const chatMessages = new Map();

// Session cleanup (prevent memory leaks)
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [sessionId, session] of chatSessions.entries()) {
        if (new Date(session.createdAt).getTime() < oneHourAgo) {
            chatSessions.delete(sessionId);
            chatMessages.delete(sessionId);
        }
    }
}, 30 * 60 * 1000); // Clean every 30 minutes

// Root route - redirect to tshirt store
app.get('/', (req, res) => {
    res.redirect('/tshirt-store.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Secure configuration endpoint
app.get('/api/config', (req, res) => {
    res.json({
        skipify: {
            merchantId: SKIPIFY_MERCHANT_ID, // Required for SDK initialization
            environment: SKIPIFY_ENVIRONMENT,
            sdkUrl: SKIPIFY_ENVIRONMENT === 'stage' 
                ? 'https://stagecdn.skipify.com/sdk/components-sdk.js'
                : 'https://prodcdn.skipify.com/sdk/components-sdk.js'
        },
        features: {
            chatEnabled: true,
            paymentsEnabled: true
        }
    });
});

// Chat endpoints with security
app.post('/api/chat/sessions', apiLimiter, (req, res) => {
    try {
        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            createdAt: new Date().toISOString(),
            status: 'active',
            ip: req.ip,
            userAgent: req.get('User-Agent')?.substring(0, 200) // Limit UA length
        };
        
        chatSessions.set(sessionId, session);
        chatMessages.set(sessionId, []);
        
        // Return only safe data
        res.json({
            id: sessionId,
            createdAt: session.createdAt,
            status: session.status
        });
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

app.post('/api/chat/messages', apiLimiter, (req, res) => {
    try {
        const { sessionId, message, role = 'user' } = req.body;
        
        // Validate session
        if (!sessionId || !chatSessions.has(sessionId)) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Validate and sanitize message
        const sanitizedMessage = validateInput(message, 500);
        if (!sanitizedMessage) {
            return res.status(400).json({ error: 'Invalid message content' });
        }
        
        const messages = chatMessages.get(sessionId) || [];
        
        // Check message history limits
        if (messages.length > 100) { // Prevent spam
            return res.status(429).json({ error: 'Message limit exceeded for this session' });
        }
        
        const userMessage = {
            id: uuidv4(),
            role: 'user',
            content: sanitizedMessage,
            timestamp: new Date().toISOString()
        };
        
        messages.push(userMessage);
        
        // Generate safe response
        let response = "I can help you with checkout. Please provide your email address.";
        
        if (sanitizedMessage.toLowerCase().includes('@')) {
            const emailMatch = sanitizedMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
                const email = emailMatch[0];
                // Basic email validation
                if (email.length <= 100 && email.includes('@') && email.includes('.')) {
                    response = `✅ **Skipify account found!**

👤 **Account Details:**
• Email: ${email}
• Payment Methods: ✅ Available

🔐 **Authentication required - please follow the prompts to authenticate on the website**`;
                }
            }
        } else if (sanitizedMessage.toLowerCase().includes('help')) {
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
    } catch (error) {
        console.error('Message processing error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Secure payment endpoint with enhanced validation
app.post('/api/skipify/payments', paymentLimiter, (req, res) => {
    try {
        const { paymentId, sessionId, amount, merchantReference } = req.body;
        
        // Validate inputs
        if (!paymentId || !sessionId || !amount) {
            console.error('❌ Payment validation failed - missing parameters:', { 
                hasPaymentId: !!paymentId, 
                hasSessionId: !!sessionId, 
                hasAmount: !!amount 
            });
            return res.status(400).json({ error: 'Missing required payment parameters' });
        }
        
        // Validate amount (prevent negative or excessive amounts)
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0 || numAmount > 100000) { // Max $1000.00 for demo
            console.error('❌ Payment amount validation failed:', { 
                amount: amount, 
                numAmount: numAmount, 
                inDollars: (numAmount / 100).toFixed(2) 
            });
            return res.status(400).json({ error: 'Invalid payment amount' });
        }
        
        // Note: sessionId here is the Skipify session ID, not chat session ID
        // For demo purposes, we don't need to validate it against chat sessions
        // In production, you would validate against Skipify's session system
        console.log(`Processing payment for Skipify session: ${sessionId?.substring(0, 8)}...`);
        
        // Mock payment processing for demo (in production, call real Skipify API)
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const pspTransactionId = `psp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // Log payment attempt (for audit trail)
        console.log(`✅ Payment processing: ${transactionId}, Amount: $${numAmount}, Skipify Session: ${sessionId?.substring(0, 8)}...`);
        
        const responseData = {
            success: true,
            paymentId: validateInput(paymentId, 100),
            transactionId,
            pspTransactionId,
            status: 'completed',
            receipt: {
                id: `receipt_${Date.now()}`,
                transactionId,
                pspTransactionId,
                amount: numAmount,
                currency: 'USD',
                timestamp: new Date().toISOString(),
                paymentMethod: 'Skipify Account',
                merchantId: SKIPIFY_MERCHANT_ID // Secure from env
            }
        };
        
        console.log(`✅ Payment successful: ${transactionId} - Returning response`);
        res.json(responseData);
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Payment processing failed' });
    }
});

// Admin stats endpoint (should be protected in production)
app.get('/api/admin/stats', (req, res) => {
    // In production, add authentication middleware here
    res.json({
        totalSessions: chatSessions.size,
        totalMessages: Array.from(chatMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Security headers for all responses
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Security Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    
    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
        error: isDev ? err.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🔒 Secure server running on port ${PORT}`);
    console.log(`🛡️ Security features enabled: Helmet, CORS, Rate Limiting, Input Validation`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;