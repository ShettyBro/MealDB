// Login Functionality

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
    // Try to parse JSON error; fall back to status text
    let message = `Request failed (${response.status})`;
    try {
      const errData = await response.json();
      if (errData && errData.message) message = errData.message;
    } catch {
      // if not JSON, try text
      try {
        const errText = await response.text();
        if (errText) message = errText;
      } catch {}
    }

    const error = new Error(message);
    error.status = response.status; // <-- important
    throw error;
  }

    const data = await response.json();

    localStorage.setItem('pname', data.name);          
       localStorage.setItem('pemail', data.email); 
              localStorage.setItem('userId', data.userId); 

            localStorage.setItem('authToken', data.token);
             // Set expiration time for the token (5 hours in milliseconds)
             const expirationTime = Date.now() + (5 * 60 * 60 * 1000);
             localStorage.setItem('tokenExpiration', expirationTime);
        showPopup('Login successful! Redirecting...', 'success');

    
    setTimeout(() => {
      window.location.href = 'Home.html';
    }, 3000);

    
  } catch (error) {
  console.error('Login error:', error);

  // Network errors: fetch throws TypeError on network failure/CORS/server down
  const isNetworkError = error instanceof TypeError || /NetworkError|Failed to fetch/i.test(error.message);

  if (error.status === 401) {
    showPopup('Invalid username or password. Please try again.', 'error');
  } else if (error.status >= 500) {
    showPopup('Server error. Please try again in a few minutes.', 'error');
  } else if (isNetworkError) {
    showPopup('Server seems down or unreachable. Please check your connection and try again.', 'error');
  } else {
    // Use whatever message we have (e.g., 400 validation from server)
    showPopup(error.message || 'Something went wrong. Please try again.', 'error');
  }

  loginBtn.disabled = false;
  loginBtn.textContent = 'Login';
}
});

function showPopup(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message show ${type}`;
}

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    showPopup('You are already logged in. Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'Home.html';
    }, 3000);
  }
});
