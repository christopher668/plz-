// signin.js
// Simple client-side sign-in validation (demo only)
document.getElementById('signin-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('error-msg');

  if (!username || !password) {
    errorMsg.textContent = 'Please enter both username and password.';
    return;
  }

  try {
    const res = await fetch('/api/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      errorMsg.textContent = '';
      window.location.href = '/index.html';
    } else {
      errorMsg.textContent = data.message || 'Sign in failed.';
    }
  } catch (err) {
    errorMsg.textContent = 'Network error.';
  }
});
