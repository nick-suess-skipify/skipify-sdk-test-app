// Configuration for different environments
const config = {
    // Backend API URL - automatically detects environment
    BACKEND_URL: (() => {
        // Check if we're in production (Digital Ocean App Platform)
        if (window.location.hostname.includes('.ondigitalocean.app') || 
            window.location.hostname.includes('.do.')) {
            // Use the backend service URL in production
            return window.location.protocol + '//' + window.location.hostname.replace('frontend-', 'backend-');
        }
        
        // Check if BACKEND_URL is provided via environment variable (for flexibility)
        if (typeof BACKEND_URL !== 'undefined') {
            return BACKEND_URL;
        }
        
        // Default to localhost for development
        return 'http://localhost:3000';
    })(),
    
    // Skipify Configuration
    SKIPIFY: {
        MERCHANT_ID: '1bdc8b60-6dd4-4126-88e1-c9e5b570f1a0',
        ENVIRONMENT: 'stage',
        SDK_URL: 'https://stagecdn.skipify.com/sdk/components-sdk.js'
    }
};

// Make config available globally
window.APP_CONFIG = config;

console.log('🔧 App Configuration:', {
    backendUrl: config.BACKEND_URL,
    environment: window.location.hostname.includes('.ondigitalocean.app') ? 'production' : 'development'
});
