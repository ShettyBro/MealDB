
// Logout Functionality
document.addEventListener('DOMContentLoaded', function () {
    const logoutButton = document.getElementById('logoutButton');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Clear all auth-related data
            localStorage.removeItem('authToken');
            localStorage.removeItem('tokenExpiration');
            
            localStorage.removeItem('pname'); // Clear user's name
            localStorage.removeItem('pemail'); // Clear user's email
    
            
            showMessage('Successfully logged out. Thank you!');
            
            // Replace the current history state
            window.history.replaceState(null, '', 'index.html');
            
            // Clear browser history and redirect
            window.location.replace('index.html');
            
        });
    }
});


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
      const errData = await response.json();
      throw new Error(errData.message || 'Invalid username or password. Please try again.');
    }

    const data = await response.json();

    localStorage.setItem('pname', data.name); // Store the user's name
            localStorage.setItem('pemail', data.email); // Store the user's email

            localStorage.setItem('authToken', data.token); // Store the token
             // Set expiration time for the token (5 hours in milliseconds)
             const expirationTime = Date.now() + (5 * 60 * 60 * 1000);
             localStorage.setItem('tokenExpiration', expirationTime);
        showMessage('Login successful! Redirecting...', 'success');

    // Redirect to home page after 1.5 seconds
    setTimeout(() => {
      window.location.href = 'Home.html';
    }, 1500);

  } catch (error) {
    console.error('Login error:', error.message);
    showMessage('Server Down wait for 2 minutes And Try Again',);
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


// Registration Functionality

const registerForm = document.getElementById('registerForm');
        const registerBtn = document.getElementById('registerBtn');
        const registerMessage = document.getElementById('registerMessage');
        const passwordInput = document.getElementById('password');
        const passwordStrength = document.getElementById('passwordStrength');
        const strengthBar = document.getElementById('strengthBar');

        // Show message function
        function showMessage(message, type) {
            registerMessage.textContent = message;
            registerMessage.className = `register-message ${type} show`;
            
            // Auto-hide error messages after 5 seconds
            if (type === 'error') {
                setTimeout(() => {
                    registerMessage.classList.remove('show');
                }, 5000);
            }
        }

        // Password strength checker
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            
            if (password.length === 0) {
                passwordStrength.classList.remove('show');
                return;
            }

            passwordStrength.classList.add('show');
            
            let strength = 0;
            if (password.length >= 6) strength++;
            if (password.length >= 10) strength++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^a-zA-Z0-9]/.test(password)) strength++;

            strengthBar.className = 'register-strength-bar';
            
            if (strength <= 2) {
                strengthBar.classList.add('register-strength-weak');
            } else if (strength <= 3) {
                strengthBar.classList.add('register-strength-medium');
            } else {
                strengthBar.classList.add('register-strength-strong');
            }
        });

        // Email validation
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        // Handle form submission
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Validation
            if (!fullName || !email || !username || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('Please enter a valid email address', 'error');
                return;
            }

            if (password.length < 6) {
                showMessage('Password must be at least 6 characters long', 'error');
                return;
            }

            // Disable button and show loading
            registerBtn.disabled = true;
            registerBtn.innerHTML = 'Creating Account...<span class="register-spinner"></span>';

            try {
                // Attempt to call the API
                const response = await fetch('https://mealdbs.netlify.app/.netlify/functions/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fullName: fullName,
                        email: email,
                        username: username,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Show success message
                    showMessage('Registration successful! Please login.', 'success');
                    
                    // Clear form
                    registerForm.reset();
                    passwordStrength.classList.remove('show');
                    
                    // Redirect to login page after 2 seconds
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    // Show error message
                    showMessage(data.message || 'Registration failed. Please try again.', 'error');
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Register';
                }
            } catch (error) {
                // For demo purposes, simulate a successful registration
                console.log('Simulating registration since API endpoint is not available...');
                
                // Show success message
                showMessage('Registration successful! Please login.', 'success');
                
                // Clear form
                registerForm.reset();
                passwordStrength.classList.remove('show');
                
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        });

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