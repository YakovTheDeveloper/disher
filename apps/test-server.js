const http = require('http');
const https = require('https');
const fs = require('fs');

console.log('Testing server...\n');

// Test HTTP
const httpReq = http.get('http://localhost:3100/health', (res) => {
  console.log('HTTP Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HTTP Response:', data));
});
httpReq.on('error', (e) => console.log('HTTP Error:', e.message));

// Test HTTPS with certs
const httpsOptions = {
  cert: fs.readFileSync('disher-backend-3.0/certs/localhost-cert.pem'),
  key: fs.readFileSync('disher-backend-3.0/certs/localhost-key.pem')
};

const httpsReq = https.request({
  hostname: 'localhost',
  port: 3100,
  path: '/health',
  method: 'GET',
  ...httpsOptions
}, (res) => {
  console.log('\nHTTPS Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HTTPS Response:', data));
});
httpsReq.on('error', (e) => console.log('\nHTTPS Error:', e.message));
httpsReq.end();
