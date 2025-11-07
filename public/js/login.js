// Login functionality

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const messageDiv = document.getElementById('loginMessage');


loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Show loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML = 'Logging in<span class="spinner"></span>';
  messageDiv.classList.remove('show', 'success', 'error');

  try {
    const response = await fetch('https://mealdbs.netlify.app/.netlify/functions/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }) 
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Login failed');
    }

    const data = await response.json();

    if (response.ok) {
            const data = await response.json();
            localStorage.setItem('pname', data.name); // Store the user's name
            localStorage.setItem('pemail', data.email); // Store the user's email

            localStorage.setItem('authToken', data.token); // Store the token
             // Set expiration time for the token (5 hours in milliseconds)
             const expirationTime = Date.now() + (5 * 60 * 60 * 1000);
             localStorage.setItem('tokenExpiration', expirationTime);
            showMessage('Login successful! Redirecting to home...', 'home.html');
        } else {
            showMessage('Invalid username or password.');
        }
    
    // Redirect to home page after 1.5 seconds
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);

  } catch (error) {
    console.error('Login error:', error.message);
    showMessage('Invalid username or password. Please try again.', 'error');
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});

function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message show ${type}`;
}

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    showMessage('You are already logged in. Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }
});
