
// Ensure required modules are loaded at the top
const http = require('http');
const fs = require('fs');
const path = require('path');

// File-based storage setup
const DATA_DIR = path.join(__dirname, 'data');
const DM_FILE = path.join(DATA_DIR, 'dms.json');
const REPORT_FILE = path.join(DATA_DIR, 'reports.json');
const SUSPEND_FILE = path.join(DATA_DIR, 'suspended.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DM_FILE)) fs.writeFileSync(DM_FILE, '[]');
if (!fs.existsSync(REPORT_FILE)) fs.writeFileSync(REPORT_FILE, '[]');
if (!fs.existsSync(SUSPEND_FILE)) fs.writeFileSync(SUSPEND_FILE, '{}');

function readDMs() {
  return JSON.parse(fs.readFileSync(DM_FILE, 'utf8'));
}
function writeDMs(dms) {
  fs.writeFileSync(DM_FILE, JSON.stringify(dms, null, 2));
}
function readReports() {
  return JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
}
function writeReports(reports) {
  fs.writeFileSync(REPORT_FILE, JSON.stringify(reports, null, 2));
}
function readSuspended() {
  return JSON.parse(fs.readFileSync(SUSPEND_FILE, 'utf8'));
}
function writeSuspended(suspended) {
  fs.writeFileSync(SUSPEND_FILE, JSON.stringify(suspended, null, 2));
}

const port = 3000;
const base = path.join(__dirname);

// Simple in-memory session store
const sessions = {};
const USER = { username: 'user', password: 'pass' };
const DEV = { username: 'dev', password: 'devpass' };
// In-memory message store for group chat
// Each message: { id, message, time, parentId, username }
const messages = [];
let nextMessageId = 1;

// In-memory DM store: { [user1_user2]: [ { from, to, message, time } ] }
const dms = {};

// In-memory report store: { id, from, reported, reason, time }
const reports = [];
let nextReportId = 1;

// Suspended users: { username: true }
const suspended = {};


const server = http.createServer((req, res) => {
  // Serve static HTML files from Views directory
  if (req.url.includes('.html') && req.method === 'GET') {
    // Remove query string
    const cleanUrl = req.url.split('?')[0];
    const filePath = path.join(__dirname, cleanUrl.replace(/^\//, ''));
    if (fs.existsSync(filePath) && filePath.endsWith('.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(filePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
  }
  // Handle sign-in POST
  if (req.url === '/api/signin' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        let user = null;
        if (data.username === USER.username && data.password === USER.password) {
          user = USER;
        } else if (data.username === DEV.username && data.password === DEV.password) {
          user = DEV;
        }
        // Block suspended users from logging in (file-based)
        if (user) {
          const suspended = readSuspended();
          if (suspended[user.username]) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'You are suspended.' }));
            return;
          }
          const sessionId = generateSessionId();
          sessions[sessionId] = { username: user.username };
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

  // Endpoint to get all messages
  if (req.url === '/api/messages' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(messages));
    return;
  }

  // Handle texting POST
  if (req.url === '/api/text' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (typeof data.message === 'string' && data.message.trim()) {
          // Save the message to the group chat, with optional parentId
          // Get username from session (if available)
          let username = 'Anonymous';
          const cookies = parseCookies(req.headers.cookie);
          if (cookies.session && sessions[cookies.session]) {
            username = sessions[cookies.session].username;
          }
          // Block suspended users from sending messages
          if (suspended[username]) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'You are suspended.' }));
            return;
          }
          const msgObj = {
            id: nextMessageId++,
            message: data.message.trim(),
            time: new Date().toISOString(),
            parentId: typeof data.parentId === 'number' ? data.parentId : null,
            username
          };
          messages.push(msgObj);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: msgObj }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Message required.' }));
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
  // Handle report POST
  if (req.url === '/api/report' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        let from = 'Anonymous';
        const cookies = parseCookies(req.headers.cookie);
        if (cookies.session && sessions[cookies.session]) {
          from = sessions[cookies.session].username;
        }
        const reported = data.username; // frontend sends { username, reason }
        const reason = data.reason;
        if (!reported || !reason) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Reported user and reason required.' }));
          return;
        }
        const reports = readReports();
        const reportObj = { id: Date.now(), from, reported, reason, time: new Date().toISOString() };
        reports.push(reportObj);
        writeReports(reports);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, report: reportObj }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bad request' }));
      }
    });
    return;
  }

  // Handle suspension (dev only)
  if (req.url === '/api/suspend' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const cookies = parseCookies(req.headers.cookie);
        if (!(cookies.session && sessions[cookies.session] && sessions[cookies.session].username === 'dev')) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Only dev can suspend.' }));
          return;
        }
        const user = data.username; // frontend sends { username }
        if (!user) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'User required.' }));
          return;
        }
        const suspended = readSuspended();
        suspended[user] = true;
        writeSuspended(suspended);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bad request' }));
      }
    });
    return;
  }

  // Handle DM POST
  if (req.url === '/api/dm' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // Get sender username from session
        let from = 'Anonymous';
        const cookies = parseCookies(req.headers.cookie);
        if (cookies.session && sessions[cookies.session]) {
          from = sessions[cookies.session].username;
        }
        const to = data.to;
        if (!to || typeof data.message !== 'string' || !data.message.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Recipient and message required.' }));
          return;
        }
        // Block suspended users from sending DMs
        const suspended = readSuspended();
        if (suspended[from]) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'You are suspended.' }));
          return;
        }
        const dms = readDMs();
        const dmObj = { from, to, message: data.message.trim(), time: new Date().toISOString() };
        dms.push(dmObj);
        writeDMs(dms);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, dm: dmObj }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bad request' }));
      }
    });
    return;
  }

  // Handle DM GET (query: ?user=username)
  if (req.url.startsWith('/api/dm?user=') && req.method === 'GET') {
    // Get current user from session
    let from = 'Anonymous';
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.session && sessions[cookies.session]) {
      from = sessions[cookies.session].username;
    }
    const to = decodeURIComponent(req.url.split('=')[1] || '');
    // Find all DMs between from and to
    const dms = readDMs();
    const convo = dms.filter(dm =>
      (dm.from === from && dm.to === to) || (dm.from === to && dm.to === from)
    ).sort((a, b) => new Date(a.time) - new Date(b.time));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(convo));
    return;
  }

  // Serve static files from Views directory
  // Only run if not an API route
  if (!req.url.startsWith('/api/')) {
    let filePath;
    if (req.url === '/' || req.url === '') {
      filePath = path.join(base, 'index.html');
    } else {
      // Remove leading slash to avoid path.join ignoring base
      filePath = path.join(base, req.url.replace(/^\//, ''));
    }
    // Prevent directory traversal
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
      let ext = path.extname(filePath).toLowerCase();
      let type = 'text/html';
      if (ext === '.js') type = 'application/javascript';
      else if (ext === '.css') type = 'text/css';
      else if (ext === '.json') type = 'application/json';
      else if (ext === '.png') type = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') type = 'image/jpeg';
      else if (ext === '.svg') type = 'image/svg+xml';
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    });
    return;
  }

});

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

// ...existing code...

function loadDmMessages(username) {
  const dmMessagesDiv = document.getElementById('dm-messages');
  dmMessagesDiv.innerHTML = ''; // Clear existing messages
  // Fetch DM messages
  fetch('/api/dm?user=' + encodeURIComponent(username))
    .then(resp => resp.json())
    .then(convo => {
      convo.forEach(dm => appendDmMessage(dm));
      // Scroll to bottom
      dmMessagesDiv.scrollTop = dmMessagesDiv.scrollHeight;
    });
}

function appendDmMessage(dm) {
  const dmMessagesDiv = document.getElementById('dm-messages');
  const isMine = dm.from === 'Anonymous'; // Change this logic based on your auth
  const div = document.createElement('div');
  div.textContent = `${dm.from}: ${dm.message} (${new Date(dm.time).toLocaleTimeString()})`;
  div.style.margin = '8px 0';
  div.style.padding = '8px';
  div.style.borderRadius = '4px';
  div.style.background = isMine ? '#dcf8c6' : '#fff';
  dmMessagesDiv.appendChild(div);
}

// Modal HTML (add this to your HTML file)
// <div id="dm-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000;">
//   <div style="background:#fff; color:#222; padding:32px; border-radius:8px; min-width:320px; max-width:90vw; box-shadow:0 2px 16px rgba(0,0,0,0.2); position:relative;">
//     <button id="close-dm-modal" style="position:absolute; top:8px; right:12px; background:none; border:none; font-size:1.3em; cursor:pointer;">✖️</button>
//     <h2 style="margin-top:0;">DM with <span id="dm-username"></span></h2>
//     <div id="dm-messages" style="max-height:200px; overflow-y:auto; background:#f4f4f4; padding:12px; border-radius:6px; margin-bottom:12px;"></div>
//     <form id="dm-form">
//       <textarea id="dm-message" rows="2" style="width:100%; padding:8px; border-radius:4px; border:1px solid #ccc;"></textarea>
//       <button type="submit" style="margin-top:8px; width:100%; padding:10px; background:#007bff; color:#fff; border:none; border-radius:4px; font-size:15px; cursor:pointer;">Send</button>
//       <div id="dm-status" style="margin-top:8px; color:#007bff; text-align:center;"></div>
//     </form>
//     <div id="suspend-user-div" style="margin-top:16px;"></div>
//   </div>
// </div>

// (Client-side suspend button code removed from server file)

// Report modal
let reportModal = null;

// Start the HTTP server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log('Demo user: user / pass');
});

function showReportModal(username) {
  if (reportModal) reportModal.remove();
  reportModal = document.createElement('div');
  reportModal.style.position = 'fixed';
  reportModal.style.left = 0;
  reportModal.style.top = 0;
  reportModal.style.width = '100vw';
  reportModal.style.height = '100vh';
  reportModal.style.background = 'rgba(0,0,0,0.3)';
  reportModal.style.zIndex = 4000;
  reportModal.style.display = 'flex';
  reportModal.style.alignItems = 'center';
  reportModal.style.justifyContent = 'center';
  reportModal.innerHTML = `
    <div style="background:#fff; color:#222; padding:32px; border-radius:8px; min-width:320px; max-width:90vw; box-shadow:0 2px 16px rgba(0,0,0,0.2); position:relative;">
      <button id="close-report-modal" style="position:absolute; top:8px; right:12px; background:none; border:none; font-size:1.3em; cursor:pointer;">✖️</button>
      <h2 style="margin-top:0;">Report <span>${username}</span></h2>
      <form id="report-form">
        <textarea id="report-reason" rows="2" style="width:100%; padding:8px; border-radius:4px; border:1px solid #ccc;" placeholder="Reason..."></textarea>
        <button type="submit" style="margin-top:8px; width:100%; padding:10px; background:#d00; color:#fff; border:none; border-radius:4px; font-size:15px; cursor:pointer;">Report</button>
        <div id="report-status" style="margin-top:8px; color:#d00; text-align:center;"></div>
      </form>
    </div>
  `;
  document.body.appendChild(reportModal);
  document.getElementById('close-report-modal').onclick = () => { reportModal.remove(); reportModal = null; };
  document.getElementById('report-form').onsubmit = async function(e) {
    e.preventDefault();
    const reason = document.getElementById('report-reason').value.trim();
    if (!reason) return;
    document.getElementById('report-status').textContent = 'Reporting...';
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reported: username, reason })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('report-status').textContent = 'Reported!';
        setTimeout(() => { reportModal.remove(); reportModal = null; }, 1000);
      } else {
        document.getElementById('report-status').textContent = data.message || 'Failed to report.';
      }
    } catch (err) {
      document.getElementById('report-status').textContent = 'Network error.';
    }
  };
}

function renderMessageNode(msg) {
  const div = document.createElement('div');
  div.style.margin = '6px 0 6px 0';
  div.style.paddingLeft = msg.parentId ? '24px' : '0';
  const p = document.createElement('p');
  // Username and message, timestamp on hover
  const userSpan = document.createElement('span');
  userSpan.textContent = msg.username ? msg.username : 'Anonymous';
  userSpan.style.fontWeight = 'bold';
  userSpan.style.color = '#007bff';
  userSpan.style.marginRight = '8px';
  userSpan.style.cursor = 'pointer';
  userSpan.onclick = e => {
    e.stopPropagation();
    showDmMenu(msg.username, e.clientX, e.clientY);
  };
  p.appendChild(userSpan);
  // Report button
  if (msg.username && msg.username !== 'Anonymous') {
    const reportBtn = document.createElement('button');
    reportBtn.textContent = 'Report';
    reportBtn.style.marginRight = '8px';
    reportBtn.style.fontSize = '0.8em';
    reportBtn.style.padding = '2px 6px';
    reportBtn.style.borderRadius = '4px';
    reportBtn.style.border = '1px solid #d00';
    reportBtn.style.background = '#fff';
    reportBtn.style.color = '#d00';
    reportBtn.style.cursor = 'pointer';
    reportBtn.onclick = e => {
      e.stopPropagation();
      showReportModal(msg.username);
    };
    p.appendChild(reportBtn);
  }
  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg.message;
  p.appendChild(msgSpan);
  p.title = new Date(msg.time).toLocaleString();
  p.style.color = '#333';
  p.style.margin = '0';
  div.appendChild(p);
  const replyBtn = document.createElement('button');
  replyBtn.textContent = 'Reply';
  replyBtn.style.margin = '2px 0 0 8px';
  replyBtn.style.fontSize = '0.9em';
  replyBtn.style.padding = '2px 8px';
  replyBtn.style.borderRadius = '4px';
  replyBtn.style.border = '1px solid #007bff';
  replyBtn.style.background = '#fff';
  replyBtn.style.color = '#007bff';
  replyBtn.style.cursor = 'pointer';
  replyBtn.onclick = () => {
    replyToId = msg.id;
    document.getElementById('message').focus();
    statusDiv.textContent = `Replying to message #${msg.id}`;
  };
  div.appendChild(replyBtn);
  // Render replies
  if (msg.replies && msg.replies.length) {
    msg.replies.forEach(r => div.appendChild(renderMessageNode(r)));
  }
  return div;
}
