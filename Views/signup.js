// signup.js
// Simple client-side sign-up validation and request

document.getElementById('signup-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('error-msg');
  const successMsg = document.getElementById('success-msg');

  errorMsg.textContent = '';
  successMsg.textContent = '';

  if (!username || !email || !password) {
    errorMsg.textContent = 'Please fill in all fields.';
    return;
  }

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (data.success) {
      successMsg.textContent = 'Registration successful! You can now sign in.';
      errorMsg.textContent = '';
      setTimeout(() => { window.location.href = '/signin.html'; }, 1500);
    } else {
      errorMsg.textContent = data.message || 'Sign up failed.';
    }
  } catch (err) {
    errorMsg.textContent = 'Network error.';
  }
});
