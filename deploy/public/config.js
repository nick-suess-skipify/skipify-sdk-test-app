// Secure Configuration - NO SENSITIVE DATA EXPOSED
const config = {
    // Backend API URL - same domain deployment
    BACKEND_URL: (() => {
        // In production, API is served from the same domain
        return window.location.origin;
    })(),
    
    // Public configuration only - NO SECRETS
    SKIPIFY: {
        // These will be fetched securely from backend
        ENVIRONMENT: null,  // Will be set by backend
        SDK_URL: null       // Will be set by backend
    },
    
    // Rate limiting settings (client-side awareness)
    RATE_LIMITS: {
        CHAT_MESSAGES_PER_MINUTE: 30,
        API_CALLS_PER_MINUTE: 60
    },
    
    // Security settings
    SECURITY: {
        CSP_ENABLED: true,
        XSS_PROTECTION: true,
        INPUT_VALIDATION: true
    }
};

// Environment detection (safe)
config.environment = window.location.hostname.includes('.ondigitalocean.app') ? 'production' : 'development';

// Make config read-only
window.APP_CONFIG = Object.freeze(config);