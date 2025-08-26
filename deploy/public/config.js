// Configuration for different environments
const config = {
    // Backend API URL - same domain deployment (frontend and backend served together)
    BACKEND_URL: (() => {
        // In production, API is served from the same domain
        return window.location.origin;
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
