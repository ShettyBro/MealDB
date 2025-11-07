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
