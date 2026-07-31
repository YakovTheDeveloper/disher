import { createServer } from 'node:http';

const PORT = 8901;

createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const code = url.pathname.replace(/^\//, '');
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} -> code="${code}"`);

  if (req.method !== 'GET') {
    res.writeHead(405, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'GET only' }));
    return;
  }

  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  if (code === '') {
    res.end(JSON.stringify({ hint: 'GET /<code> -> {"code":"<code>"} , например /abc123' }));
  } else {
    res.end(JSON.stringify({ code }));
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`code-server listening on http://0.0.0.0:${PORT}`);
});
