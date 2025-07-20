document.body.appendChild(container);
// Add nav bar with profile avatar and recent DMs dropdown
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.background = '#f4f4f4';
document.body.style.fontFamily = 'Arial, sans-serif';

const nav = document.createElement('nav');
nav.style.width = '100%';
nav.style.background = '#222';
nav.style.padding = '16px 0 12px 0';
nav.style.position = 'fixed';
nav.style.top = '0';
nav.style.left = '0';
nav.style.zIndex = '10';
nav.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

const navDiv = document.createElement('div');
navDiv.style.maxWidth = '900px';
navDiv.style.margin = '0 auto';
navDiv.style.display = 'flex';
navDiv.style.alignItems = 'center';

function navLink(text, href, extraStyle) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  a.style.color = '#fff';
  a.style.textDecoration = 'none';
  a.style.fontSize = '1.1em';
  a.style.marginRight = '32px';
  if (extraStyle) Object.assign(a.style, extraStyle);
  return a;
}
const dmsNavLink = navLink('DMs', '/direct-messages.html');
navDiv.appendChild(navLink('Dashboard', '/index.html', {fontWeight:'bold',fontSize:'1.2em'}));
navDiv.appendChild(navLink('Schedule', '/schedule.html'));
navDiv.appendChild(dmsNavLink);
navDiv.appendChild(navLink('Profile', '/profile-settings.html'));

// Recent DMs dropdown
const dmsNav = document.createElement('div');
dmsNav.id = 'recent-dms-nav';
dmsNav.style.position = 'relative';
dmsNav.style.marginLeft = '32px';
const dmsBtn = document.createElement('button');
dmsBtn.id = 'recent-dms-btn';
dmsBtn.textContent = '💬 Recent DMs';
dmsBtn.style.background = 'none';
dmsBtn.style.border = 'none';
dmsBtn.style.color = '#fff';
dmsBtn.style.fontSize = '1.1em';
dmsBtn.style.cursor = 'pointer';
const dmsDropdown = document.createElement('div');
dmsDropdown.id = 'recent-dms-dropdown';
dmsDropdown.style.display = 'none';
dmsDropdown.style.position = 'absolute';
dmsDropdown.style.top = '36px';
dmsDropdown.style.right = '0';
dmsDropdown.style.minWidth = '260px';
dmsDropdown.style.background = '#fff';
dmsDropdown.style.color = '#222';
dmsDropdown.style.borderRadius = '8px';
dmsDropdown.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
dmsDropdown.style.zIndex = '9999';
dmsDropdown.style.padding = '8px 0';
dmsDropdown.style.maxHeight = '320px';
dmsDropdown.style.overflowY = 'auto';
dmsNav.appendChild(dmsBtn);
dmsNav.appendChild(dmsDropdown);
navDiv.appendChild(dmsNav);

// Profile avatar dropdown
const navAvatarLink = document.createElement('div');
navAvatarLink.id = 'nav-avatar-link';
navAvatarLink.style.marginLeft = '18px';
navAvatarLink.style.display = 'flex';
navAvatarLink.style.alignItems = 'center';
navAvatarLink.style.position = 'relative';
navAvatarLink.style.cursor = 'pointer';
const navAvatar = document.createElement('img');
navAvatar.id = 'nav-avatar';
navAvatar.src = 'https://ui-avatars.com/api/?name=User&background=007bff&color=fff&rounded=true&size=40';
navAvatar.alt = 'Profile';
navAvatar.style.width = '38px';
navAvatar.style.height = '38px';
navAvatar.style.borderRadius = '50%';
navAvatar.style.border = '2px solid #fff';
navAvatar.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)';
navAvatar.style.objectFit = 'cover';
navAvatar.style.transition = 'border-color 0.2s';
const avatarDropdown = document.createElement('div');
avatarDropdown.id = 'avatar-dropdown';
avatarDropdown.style.display = 'none';
avatarDropdown.style.position = 'absolute';
avatarDropdown.style.top = '48px';
avatarDropdown.style.right = '0';
avatarDropdown.style.minWidth = '180px';
avatarDropdown.style.background = '#fff';
avatarDropdown.style.color = '#222';
avatarDropdown.style.borderRadius = '8px';
avatarDropdown.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
avatarDropdown.style.zIndex = '9999';
avatarDropdown.style.padding = '8px 0';
avatarDropdown.innerHTML = `
  <style>
    #avatar-dropdown, #avatar-dropdown * { color: #fff !important; background: none !important; }
    #avatar-dropdown button { color: #fff !important; }
    #avatar-dropdown a { color: #fff !important; }
    #avatar-dropdown button#dropdown-logout-btn { color: #d00 !important; }
  </style>
  <a href="/profile-settings.html" style="display:block;padding:10px 24px;text-decoration:none;color:#fff !important;font-size:1em;">Profile</a>
  <div style="height:1px;background:#eee;margin:4px 0;"></div>
  <button id="dropdown-settings-btn" style="display:block;width:100%;text-align:left;padding:10px 24px;background:none;border:none;color:#fff !important;font-size:1em;cursor:pointer;">Settings</button>
  <button id="dropdown-darkmode-btn" style="display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:10px 24px;background:none;border:none;color:#fff !important;font-size:1em;cursor:pointer;">
    <span>Dark Mode</span>
    <input type="checkbox" id="dropdown-darkmode-toggle" style="transform:scale(1.2);margin-left:auto;">
  </button>
  <button id="dropdown-logout-btn" style="display:block;width:100%;text-align:left;padding:10px 24px;background:none;border:none;color:#d00 !important;font-size:1em;cursor:pointer;">Log Out</button>
`;
navAvatarLink.appendChild(navAvatar);
navAvatarLink.appendChild(avatarDropdown);
navDiv.appendChild(navAvatarLink);

nav.appendChild(navDiv);
document.body.appendChild(nav);

// Nav bar event logic
navAvatarLink.onclick = function(e) {
  e.stopPropagation();
  avatarDropdown.style.display = avatarDropdown.style.display === 'block' ? 'none' : 'block';
  // Sync dark mode toggle
  const dark = document.body.classList.contains('dark-mode');
  const toggle = document.getElementById('dropdown-darkmode-toggle');
  if (toggle) toggle.checked = dark;
};
document.addEventListener('click', function(e) {
  if (avatarDropdown.style.display === 'block') avatarDropdown.style.display = 'none';
  if (dmsDropdown.style.display === 'block') dmsDropdown.style.display = 'none';
});
avatarDropdown.onclick = function(e) { e.stopPropagation(); };
// Settings button
avatarDropdown.querySelector('#dropdown-settings-btn').onclick = function() {
  window.location.href = '/profile-settings.html';
};
// Log out
avatarDropdown.querySelector('#dropdown-logout-btn').onclick = function() {
  localStorage.clear();
  window.location.href = '/signin.html';
};
// Dark mode toggle
avatarDropdown.querySelector('#dropdown-darkmode-toggle').onchange = e => setDarkMode(e.target.checked);

// Dark mode logic
function setDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', '1');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', '0');
  }
}
if (localStorage.getItem('darkMode') === '1') {
  setDarkMode(true);
}


// Recent DMs dropdown logic with polling
async function loadRecentDMsDropdown() {
  dmsDropdown.innerHTML = 'Loading...';
  try {
    const res = await fetch('/api/dm-conversations');
    const conversations = await res.json();
    if (!conversations.length) {
      dmsDropdown.innerHTML = '<div style="padding:12px;color:#888;">No DMs yet.</div>';
      return;
    }
    dmsDropdown.innerHTML = '';
    conversations.forEach(convo => {
      const user = convo.user;
      const last = convo.lastMessage;
      const div = document.createElement('div');
      div.className = 'dm-item';
      div.style.padding = '10px 18px';
      div.style.borderBottom = '1px solid #eee';
      div.style.cursor = 'pointer';
      div.onmouseover = () => div.style.background = '#f4f4f4';
      div.onmouseout = () => div.style.background = '';
      div.onclick = () => { window.location.href = `/dms.html?user=${encodeURIComponent(user)}`; };
      const direction = last.from === user ? 'From' : 'To';
      div.innerHTML = `<span style='font-weight:bold;color:#007bff;'>${user}</span>` +
        `<div style='color:#555;font-size:0.97em;margin-top:2px;'><b>${direction}:</b> ${last.message}</div>` +
        `<div style='color:#aaa;font-size:0.9em;margin-top:2px;'>${new Date(last.time).toLocaleString()}</div>`;
      dmsDropdown.appendChild(div);
    });
  } catch (err) {
    dmsDropdown.innerHTML = '<div style="padding:12px;color:#d00;">Failed to load DMs.</div>';
  }
}

dmsBtn.onclick = function(e) {
  e.stopPropagation();
  window.location.href = '/direct-messages.html';
};

// Poll for new DMs every 5 seconds (if dropdown is open)
setInterval(() => {
  if (dmsDropdown.style.display === 'block') {
    loadRecentDMsDropdown();
  }
}, 5000);

// Add main content
const container = document.createElement('div');
container.style.maxWidth = '600px';
container.style.margin = '80px auto 0 auto';
container.style.background = '#fff';
container.style.padding = '32px';
container.style.borderRadius = '8px';
container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

const h1 = document.createElement('h1');
h1.textContent = 'Welcome to the Index Page';
h1.style.color = '#333';

const p = document.createElement('p');
p.textContent = 'This is your functional index page. Customize it as needed!';
p.style.color = '#555';

const btn = document.createElement('a');
btn.textContent = 'Click Me';
btn.href = '#';
btn.className = 'btn';
btn.style.display = 'inline-block';
btn.style.padding = '10px 20px';
btn.style.background = '#007bff';
btn.style.color = '#fff';
btn.style.border = 'none';
btn.style.borderRadius = '4px';
btn.style.textDecoration = 'none';
btn.style.transition = 'background 0.2s';
btn.onmouseover = () => btn.style.background = '#0056b3';
btn.onmouseout = () => btn.style.background = '#007bff';
btn.onclick = (e) => { e.preventDefault(); alert('Button clicked!'); };

container.appendChild(h1);
container.appendChild(p);
container.appendChild(btn);
document.body.appendChild(container);
