import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  skipifySessionId?: string;
  merchantId?: string;
}

const App: React.FC = () => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipifyResult, setSkipifyResult] = useState<any>(null);
  const [merchantId, setMerchantId] = useState('ca4d3697-4579-4dda-9c89-ee63ae5a7b41');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const createSession = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/chat/sessions', {
        merchantId,
        initialMessage: 'Hello! I want to test the Skipify SDK'
      });
      setSession(response.data);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create chat session');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !session) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/chat/messages', {
        sessionId: session.id,
        message: message.trim()
      });

      // Update session with new message
      if (session) {
        const newSession = { ...session };
        newSession.messages.push({
          id: Date.now().toString(),
          type: 'user',
          content: message.trim(),
          timestamp: new Date().toISOString()
        });
        newSession.messages.push(response.data);
        newSession.updatedAt = new Date().toISOString();
        setSession(newSession);
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const testSkipifyOperation = async (operation: string, data: any) => {
    try {
      setLoading(true);
      let response;
      
      switch (operation) {
        case 'lookup':
          response = await axios.post('/api/skipify/lookup', data);
          break;
        case 'auth':
          response = await axios.post('/api/skipify/auth', data);
          break;
        case 'carousel':
          response = await axios.post('/api/skipify/carousel', data);
          break;
        case 'device-id':
          response = await axios.get('/api/skipify/device-id');
          break;
        default:
          throw new Error('Unknown operation');
      }

      setSkipifyResult({
        operation,
        data: response.data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error testing ${operation}:`, error);
      setSkipifyResult({
        operation,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>🚀 Skipify Test Chat App</h1>
        <p>Test the Skipify Checkout SDK with embedded components</p>
        {session && (
          <div>
            <p><strong>Session ID:</strong> {session.id}</p>
            <p><strong>Merchant ID:</strong> {session.merchantId || 'None'}</p>
            <p><strong>Skipify Session:</strong> {session.skipifySessionId || 'None'}</p>
          </div>
        )}
      </div>

      {!session ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Welcome to Skipify Test Chat!</h2>
          <p>Start a new chat session to test the Skipify Checkout SDK.</p>
          
          <div className="control-group">
            <label htmlFor="merchantId">Merchant ID:</label>
            <input
              id="merchantId"
              type="text"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder="Enter Skipify merchant ID"
            />
          </div>
          
          <button 
            onClick={createSession} 
            disabled={loading}
            style={{ fontSize: '18px', padding: '15px 30px' }}
          >
            {loading ? 'Creating Session...' : 'Start Chat Session'}
          </button>
        </div>
      ) : (
        <>
          <div className="chat-messages">
            {session.messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div><strong>{msg.type.toUpperCase()}:</strong></div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !message.trim()}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>

          <div className="skipify-controls">
            <h3>🔧 Skipify SDK Controls</h3>
            
            <div className="control-group">
              <label>Shopper Lookup:</label>
              <input
                type="email"
                placeholder="test@example.com"
                id="lookupEmail"
              />
              <input
                type="tel"
                placeholder="+1234567890"
                id="lookupPhone"
              />
              <button 
                onClick={() => {
                  const email = (document.getElementById('lookupEmail') as HTMLInputElement).value;
                  const phone = (document.getElementById('lookupPhone') as HTMLInputElement).value;
                  testSkipifyOperation('lookup', { email, phone });
                }}
                disabled={loading}
              >
                Test Lookup
              </button>
            </div>

            <div className="control-group">
              <label>Authentication:</label>
              <input
                type="text"
                placeholder="Challenge ID"
                id="authChallengeId"
              />
              <input
                type="tel"
                placeholder="+1234567890"
                id="authPhone"
              />
              <button 
                onClick={() => {
                  const challengeId = (document.getElementById('authChallengeId') as HTMLInputElement).value;
                  const phone = (document.getElementById('authPhone') as HTMLInputElement).value;
                  testSkipifyOperation('auth', { challengeId, phone });
                }}
                disabled={loading}
              >
                Test Auth
              </button>
            </div>

            <div className="control-group">
              <label>Payment Carousel:</label>
              <input
                type="number"
                placeholder="1000 (amount in cents)"
                id="carouselAmount"
                defaultValue="1000"
              />
              <input
                type="tel"
                placeholder="+1234567890"
                id="carouselPhone"
              />
              <button 
                onClick={() => {
                  const amount = parseInt((document.getElementById('carouselAmount') as HTMLInputElement).value);
                  const phone = (document.getElementById('carouselPhone') as HTMLInputElement).value;
                  testSkipifyOperation('carousel', { amount, phone });
                }}
                disabled={loading}
              >
                Test Carousel
              </button>
            </div>

            <div className="control-group">
              <button 
                onClick={() => testSkipifyOperation('device-id', {})}
                disabled={loading}
              >
                Get Device ID
              </button>
            </div>
          </div>

          {skipifyResult && (
            <div className="result-display">
              <h4>📊 Skipify Operation Result:</h4>
              <div className={skipifyResult.error ? 'error' : 'success'}>
                <strong>Operation:</strong> {skipifyResult.operation}
                <br />
                <strong>Timestamp:</strong> {new Date(skipifyResult.timestamp).toLocaleString()}
                <br />
                <strong>Result:</strong>
                <pre>{JSON.stringify(skipifyResult.error || skipifyResult.data, null, 2)}</pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App; 