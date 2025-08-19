import { v4 as uuidv4 } from 'uuid';
import { 
  SkipifyLookupResponse, 
  SkipifyAuthResponse, 
  SkipifyCarouselResponse,
  SkipifyLookupSchema,
  SkipifyAuthSchema,
  SkipifyCarouselSchema
} from './types.js';

export class SkipifyClient {
  private merchantId: string;
  private apiKey: string | null;
  private environment: 'dev' | 'stage' | 'prod';
  private baseUrl: string; // For backend API calls (services)
  private componentsUrl: string; // For frontend components (checkout)
  private sessionId: string | null = null;

  constructor(merchantId: string, environment: 'dev' | 'stage' | 'prod' = 'stage', apiKey?: string) {
    this.merchantId = merchantId;
    this.apiKey = apiKey || null;
    this.environment = environment;
    
    // Set URLs based on environment
    switch (environment) {
      case 'dev':
        this.baseUrl = 'https://services.dev.skipify.com'; // Backend API
        this.componentsUrl = 'https://checkout.dev.skipify.com'; // Frontend components
        break;
      case 'stage':
        this.baseUrl = 'https://services.staging.skipify.com'; // Backend API
        this.componentsUrl = 'https://checkout.staging.skipify.com'; // Frontend components
        break;
      case 'prod':
        this.baseUrl = 'https://services.skipify.com'; // Backend API
        this.componentsUrl = 'https://checkout.skipify.com'; // Frontend components
        break;
    }
  }

  /**
   * Initialize a new session
   */
  async initializeSession(): Promise<string> {
    this.sessionId = uuidv4();
    return this.sessionId;
  }

  /**
   * Set session ID externally (for reusing sessions)
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Perform shopper lookup
   */
  async lookupShopper(data: { email?: string; phone?: string }): Promise<SkipifyLookupResponse> {
    const validatedData = SkipifyLookupSchema.parse(data);
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Merchant-ID': this.merchantId,
    };
    
    // Add API key if available (required for services API)
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    console.log('Making request to:', `${this.baseUrl}/v1/shoppers/lookup`);
    console.log('Headers:', headers);
    console.log('Body:', JSON.stringify(validatedData));
    
    // For staging environment, set Node.js to ignore SSL certificate issues
    if (this.environment === 'stage') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedData),
    };
    
    // Use the correct Skipify API endpoint
    const response = await fetch(`${this.baseUrl}/v1/shoppers/lookup`, fetchOptions);

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`Lookup failed: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Authenticate shopper
   */
  async authenticateShopper(data: {
    challengeId: string;
    phone?: string;
    sendOtp?: boolean;
    displayMode?: 'embedded' | 'overlay';
    config?: {
      theme?: 'light' | 'dark';
      fontFamily?: 'serif' | 'sans-serif' | 'default';
      fontSize?: 'small' | 'medium' | 'large';
      inputFieldSize?: 'small' | 'medium';
    };
  }): Promise<SkipifyAuthResponse> {
    const validatedData = SkipifyAuthSchema.parse(data);
    
    const response = await fetch(`${this.componentsUrl}/components/${this.merchantId}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId || '',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Show payment carousel
   */
  async showCarousel(data: {
    amount: number;
    phone?: string;
    sendOtp?: boolean;
    displayMode?: 'embedded' | 'overlay';
    config?: {
      theme?: 'light' | 'dark';
      fontFamily?: 'serif' | 'sans-serif' | 'default';
      fontSize?: 'small' | 'medium' | 'large';
      inputFieldSize?: 'small' | 'medium';
    };
  }): Promise<SkipifyCarouselResponse> {
    const validatedData = SkipifyCarouselSchema.parse(data);
    
    const response = await fetch(`${this.componentsUrl}/components/${this.merchantId}/carousel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId || '',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      throw new Error(`Carousel failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get device ID
   */
  async getDeviceId(): Promise<string> {
    const response = await fetch(`${this.componentsUrl}/components/${this.merchantId}/device-id`, {
      method: 'GET',
      headers: {
        'X-Session-ID': this.sessionId || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Device ID request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.deviceId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get SDK configuration for client-side initialization
   */
  getSDKConfig() {
    return {
      merchantId: this.merchantId,
      environment: this.environment,
      sessionId: this.sessionId,
      baseUrl: this.baseUrl,
      componentsUrl: `${this.componentsUrl}/components/${this.merchantId}`,
    };
  }

  /**
   * Generate client-side SDK script using CDN method
   */
  generateSDKScript(): string {
    const config = this.getSDKConfig();
    
    return `
      // Skipify Checkout SDK Configuration
      window.skipifyConfig = ${JSON.stringify(config, null, 2)};
      
      // Load Skipify SDK from CDN
      (function() {
        var script = document.createElement('script');
        script.src = 'https://stagecdn.skipify.com/sdk/components-sdk.js';
        script.async = true;
        script.onload = function() {
          // Initialize Skipify client
          window.skipifyComponentsSdk = new window.skipify({
            merchantId: '${this.merchantId}'
          });
          console.log('Skipify SDK loaded and initialized');
        };
        document.head.appendChild(script);
      })();
    `;
  }

  /**
   * Generate test HTML page
   */
  generateTestPage(): string {
    const sdkScript = this.generateSDKScript();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skipify Checkout SDK Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .test-section {
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .test-section h3 {
            margin-top: 0;
            color: #333;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #0056b3;
        }
        input {
            padding: 8px;
            margin: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
            width: 200px;
        }
        .result {
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 3px;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
        }
        .success {
            background: #d4edda;
            color: #155724;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Skipify Checkout SDK Test Page</h1>
        <p><strong>Environment:</strong> ${this.environment}</p>
        <p><strong>Merchant ID:</strong> ${this.merchantId}</p>
        <p><strong>Session ID:</strong> ${this.sessionId}</p>
        
        <div class="test-section">
            <h3>Shopper Lookup</h3>
            <input type="email" id="lookupEmail" placeholder="Enter email">
            <input type="tel" id="lookupPhone" placeholder="Enter phone">
            <button onclick="testLookup()">Test Lookup</button>
            <div id="lookupResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>Authentication</h3>
            <input type="text" id="authChallengeId" placeholder="Challenge ID">
            <input type="tel" id="authPhone" placeholder="Phone number">
            <button onclick="testAuth()">Test Authentication</button>
            <div id="authResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>Payment Carousel</h3>
            <input type="number" id="carouselAmount" placeholder="Amount" value="1000">
            <input type="tel" id="carouselPhone" placeholder="Phone number">
            <button onclick="testCarousel()">Test Carousel</button>
            <div id="carouselResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>Device ID</h3>
            <button onclick="testDeviceId()">Get Device ID</button>
            <div id="deviceIdResult" class="result"></div>
        </div>
    </div>

    <script>
        ${sdkScript}
        
        // Test functions
        async function testLookup() {
            const email = document.getElementById('lookupEmail').value;
            const phone = document.getElementById('lookupPhone').value;
            const resultDiv = document.getElementById('lookupResult');
            
            try {
                const response = await fetch('/api/skipify/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, phone })
                });
                
                const result = await response.json();
                resultDiv.textContent = JSON.stringify(result, null, 2);
                resultDiv.className = 'result success';
            } catch (error) {
                resultDiv.textContent = 'Error: ' + error.message;
                resultDiv.className = 'result error';
            }
        }
        
        async function testAuth() {
            const challengeId = document.getElementById('authChallengeId').value;
            const phone = document.getElementById('authPhone').value;
            const resultDiv = document.getElementById('authResult');
            
            try {
                const response = await fetch('/api/skipify/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ challengeId, phone })
                });
                
                const result = await response.json();
                resultDiv.textContent = JSON.stringify(result, null, 2);
                resultDiv.className = 'result success';
            } catch (error) {
                resultDiv.textContent = 'Error: ' + error.message;
                resultDiv.className = 'result error';
            }
        }
        
        async function testCarousel() {
            const amount = parseFloat(document.getElementById('carouselAmount').value);
            const phone = document.getElementById('carouselPhone').value;
            const resultDiv = document.getElementById('carouselResult');
            
            try {
                const response = await fetch('/api/skipify/carousel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, phone })
                });
                
                const result = await response.json();
                resultDiv.textContent = JSON.stringify(result, null, 2);
                resultDiv.className = 'result success';
            } catch (error) {
                resultDiv.textContent = 'Error: ' + error.message;
                resultDiv.className = 'result error';
            }
        }
        
        async function testDeviceId() {
            const resultDiv = document.getElementById('deviceIdResult');
            
            try {
                const response = await fetch('/api/skipify/device-id');
                const result = await response.json();
                resultDiv.textContent = JSON.stringify(result, null, 2);
                resultDiv.className = 'result success';
            } catch (error) {
                resultDiv.textContent = 'Error: ' + error.message;
                resultDiv.className = 'result error';
            }
        }
    </script>
</body>
</html>
    `;
  }
} 