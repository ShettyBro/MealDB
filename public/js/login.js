// Login functionality

const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const messageDiv = document.getElementById('message');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Show loading state
            loginBtn.disabled = true;
            loginBtn.innerHTML = 'Logging in<span class="spinner"></span>';
            messageDiv.classList.remove('show', 'success', 'error');

            try {
                // Simulate API call
                const response = await fetch('https://mealdbs.netlify.app/.netlify/functions/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });

                // Since this is a demo and the endpoint doesn't exist,
                // we'll simulate a successful login for demo purposes
                if (!response.ok) {
                    throw new Error('Login failed');
                }

                const data = await response.json();
                
                // Save token to localStorage
                localStorage.setItem('token', data.token);
                
                // Show success message
                showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to home page after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);

            } catch (error) {
                // For demo purposes, simulate successful login with demo credentials
                if (username === 'demo' && password === 'demo123') {
                    // Simulate token
                    const demoToken = 'demo_jwt_token_' + Date.now();
                    localStorage.setItem('token', demoToken);
                    
                    showMessage('Login successful! Redirecting...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    // Show error message
                    showMessage('Invalid username or password. Try demo/demo123', 'error');
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Login';
                }
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