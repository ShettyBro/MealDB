// Show confirmation popup
function showLogoutConfirmPopup() {
    document.getElementById('logoutConfirmPopup').style.display = 'flex';
}

// Hide confirmation popup
function closeLogoutConfirmPopup() {
    document.getElementById('logoutConfirmPopup').style.display = 'none';
}

// Attach logout logic
document.addEventListener('DOMContentLoaded', function () {
    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', function (e) {
            e.preventDefault();
            showLogoutConfirmPopup();
        });
    }

    // YES button → Logout
    const yesBtn = document.getElementById('logoutYesBtn');
    if (yesBtn) {
        yesBtn.addEventListener('click', function () {
            // Clear auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('tokenExpiration');
            localStorage.removeItem('pname');
            localStorage.removeItem('pemail');
            localStorage.removeItem('userId');

            window.location.href = 'index.html';
        });
    }

    // NO button → Close popup
    const noBtn = document.getElementById('logoutNoBtn');
    if (noBtn) {
        noBtn.addEventListener('click', function () {
            closeLogoutConfirmPopup();
        });
    }
});



// Universal popup functions
function showPopup(message, title = "Message") {
    const popup = document.getElementById('universalPopup');
    const messageEl = document.getElementById('popupMessage');
    const titleEl = document.getElementById('popupTitle');

    if (!popup || !messageEl || !titleEl) return;

    titleEl.textContent = title;
    messageEl.textContent = message;

    popup.style.display = "flex"; // show popup
}

function closePopup() {
    const popup = document.getElementById('universalPopup');
    if (popup) popup.style.display = "none";
}
