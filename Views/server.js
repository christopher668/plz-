// Simple static server for Views directory
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const base = path.join(__dirname);

// Simple in-memory session store
const sessions = {};
const USER = { username: 'user', password: 'pass' };

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

function generateSessionId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

const server = http.createServer((req, res) => {
  // Handle sign-in POST
  if (req.url === '/api/signin' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.username === USER.username && data.password === USER.password) {
          const sessionId = generateSessionId();
          sessions[sessionId] = { username: USER.username };
          res.writeHead(200, {
            'Set-Cookie': `session=${sessionId}; HttpOnly; Path=/`,
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bad request' }));
      }
    });
    return;
  }

  // Check session for protected pages
  const cookies = parseCookies(req.headers.cookie);
  const session = sessions[cookies.session];
  if ((req.url === '/' || req.url === '/index.html') && !session) {
    // Not authenticated, redirect to sign in
    res.writeHead(302, { Location: '/signin.html' });
    res.end();
    return;
  }

  // Serve static files
  let filePath = path.join(base, req.url === '/' ? '/index.html' : req.url);
  if (!filePath.startsWith(base)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    let ext = path.extname(filePath);
    let type = 'text/html';
    if (ext === '.js') type = 'application/javascript';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log('Demo user: user / pass');
});
