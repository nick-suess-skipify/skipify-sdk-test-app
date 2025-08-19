const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Completely remove CSP headers to allow unrestricted iframe embedding
    // This should resolve the "Iframe is not available" error
    
    if (req.url === '/' || req.url === '/index.html') {
        req.url = '/simple-test.html';
    }
    
    const filePath = path.join(__dirname, req.url);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        const ext = path.extname(filePath);
        let contentType = 'text/html';
        
        if (ext === '.js') {
            contentType = 'application/javascript';
        } else if (ext === '.css') {
            contentType = 'text/css';
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log(`🛍️ T-Shirt Store: http://localhost:${PORT}/tshirt-store.html`);
    console.log(`📋 Simple test: http://localhost:${PORT}/simple-test.html`);
    console.log(`🔍 Debug page: http://localhost:${PORT}/debug-sdk.html`);
    console.log(`🔧 Minimal test: http://localhost:${PORT}/minimal-test.html`);
    console.log(`✅ Working playground: http://localhost:${PORT}/working-playground.html`);
    console.log(`🔄 Simple fallback: http://localhost:${PORT}/simple-fallback.html`);
}); 