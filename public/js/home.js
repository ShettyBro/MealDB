// home.js - Updated to fetch real recipes from database

let recipes = [];
let isLoggedIn = false;

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const expirationTime = localStorage.getItem('tokenExpiration');
    
    if (token && expirationTime && Date.now() < expirationTime) {
        isLoggedIn = true;
        return true;
    }
    
    isLoggedIn = false;
    return false;
}

// Fetch recipes from API
async function fetchRecipes() {
    const grid = document.getElementById('recipeGrid');
    
    // Show loading state
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #666;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #e0e0e0; border-radius: 50%; border-top-color: #d4af37; animation: spin 0.8s linear infinite;"></div>
                <p style="margin-top: 1rem; font-size: 1.1rem;">Loading delicious recipes...</p>
            </div>
        `;
    }

    try {
        console.log('Fetching recipes from API...');
        const response = await fetch('https://mealdbs.netlify.app/.netlify/functions/getRecipes');
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipes');
        }

        const data = await response.json();
        console.log('Recipes fetched:', data);

        recipes = data.recipes || [];
        
        if (recipes.length === 0) {
            if (grid) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;">🍳</div>
                        <h2 style="color: #666; margin-bottom: 0.5rem;">No Recipes Yet</h2>
                        <p style="color: #999;">Be the first to add a recipe!</p>
                    </div>
                `;
            }
            return;
        }

        renderRecipes();

    } catch (error) {
        console.error('Error fetching recipes:', error);
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #dc3545;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h2 style="margin-bottom: 0.5rem;">Failed to Load Recipes</h2>
                    <p style="color: #666; margin-bottom: 1rem;">Please check your connection and try again.</p>
                    <button onclick="fetchRecipes()" style="padding: 0.75rem 1.5rem; background-color: #d4af37; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// Render recipe cards
function renderRecipes() {
    const grid = document.getElementById('recipeGrid');
    if (!grid) return;

    grid.innerHTML = '';

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        // Use the image URL from database or fallback
        const imageUrl = recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${recipe.title}" class="recipe-image" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'">
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                ${isLoggedIn ? 
                    `<button class="view-btn" onclick="viewRecipe(${recipe.id})">View Details</button>` 
                    : 
                    `<button class="view-btn" onclick="showLoginPopup()">View Details</button>`
                }
            </div>
        `;
        grid.appendChild(card);
    });
}

// View recipe details (for logged-in users)
function viewRecipe(recipeId) {
    if (isLoggedIn) {
        window.location.href = `recipe.html?id=${recipeId}`;
    } else {
        showLoginPopup();
    }
}

// Show login popup (for non-logged-in users)
function showLoginPopup() {
    const popup = document.getElementById('loginPopup');
    if (popup) {
        popup.classList.add('active');
    }
}

// Close popup
function closePopup() {
    const popup = document.getElementById('loginPopup');
    if (popup) {
        popup.classList.remove('active');
    }
}

// Handle logout
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (confirm('Are you sure you want to logout?')) {
            // Clear all auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('tokenExpiration');
            localStorage.removeItem('userId');
            localStorage.removeItem('pname');
            localStorage.removeItem('pemail');
            
            // Redirect to index
            window.location.href = 'index.html';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded. Checking authentication...');
    checkAuth();
    console.log('User logged in:', isLoggedIn);
    
    // Fetch and display recipes
    fetchRecipes();
});

// Add CSS for loading spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);