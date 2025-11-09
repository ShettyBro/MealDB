// recipeDetails.js - Updated to fetch single recipe from database

let isLoggedIn = false;
let currentRecipe = null;

// Check authentication on page load
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const expirationTime = localStorage.getItem('tokenExpiration');
    
    isLoggedIn = !!(token && expirationTime && Date.now() < expirationTime);
    
    if (!isLoggedIn) {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
        return false;
    }
    return true;
}

// Get recipe ID from URL parameters
function getRecipeId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load and display recipe
async function loadRecipe(id) {
    const content = document.getElementById('recipeContent');
    
    if (!content) return;

    // Show loading state
    content.innerHTML = `
        <div class="recipedetails-loading">
            <div class="recipedetails-spinner"></div>
            <p style="font-size: 1.1rem;">Loading delicious recipe...</p>
        </div>
    `;

    try {
        console.log(`Fetching recipe with ID: ${id}...`);
        const response = await fetch(`https://mealdbs.netlify.app/.netlify/functions/getRecipeById?id=${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Recipe not found');
            }
            throw new Error('Failed to fetch recipe');
        }

        const data = await response.json();
        console.log('Recipe fetched:', data);

        currentRecipe = data.recipe;
        renderRecipe(currentRecipe);

    } catch (error) {
        console.error('Error loading recipe:', error);
        content.innerHTML = `
            <div class="recipedetails-error-state">
                <div class="recipedetails-error-icon">🔍</div>
                <h2 class="recipedetails-error-title">Recipe Not Found</h2>
                <p class="recipedetails-error-text">We couldn't find the recipe you're looking for. It may have been removed or doesn't exist.</p>
                <button class="recipedetails-back-btn" onclick="window.location.href='Home.html'">
                    Back to Home
                </button>
            </div>
        `;
    }
}

// Render recipe details to the page
function renderRecipe(recipe) {
    const content = document.getElementById('recipeContent');
    
    if (!content || !recipe) return;

    // Parse ingredients (split by newlines)
    const ingredientsArray = recipe.ingredients ? recipe.ingredients.split('\n').filter(i => i.trim()) : [];
    
    // Parse steps (split by newlines)
    const stepsArray = recipe.steps ? recipe.steps.split('\n').filter(s => s.trim()) : [];
    
    // Generate ingredients HTML
    const ingredientsHTML = ingredientsArray.length > 0 ? 
        ingredientsArray.map(ingredient => `
            <li class="recipedetails-ingredient-item">
                <span class="recipedetails-ingredient-bullet">✓</span>
                <span>${ingredient}</span>
            </li>
        `).join('') 
        : '<li class="recipedetails-ingredient-item"><span>No ingredients listed</span></li>';
    
    // Generate steps HTML
    const stepsHTML = stepsArray.length > 0 ?
        stepsArray.map(step => `
            <li class="recipedetails-step-item">
                <div class="recipedetails-step-number"></div>
                <div class="recipedetails-step-text">${step}</div>
            </li>
        `).join('')
        : '<li class="recipedetails-step-item"><div class="recipedetails-step-text">No steps provided</div></li>';
    
    // Use image URL from database or fallback
    const imageUrl = recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop';
    
    // Format date
    const createdDate = recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : 'Unknown';
    
    // Render complete recipe
    content.innerHTML = `
        <img src="${imageUrl}" alt="${recipe.title}" class="recipedetails-hero-image" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop'">
        
        <div class="recipedetails-content">
            <div class="recipedetails-header">
                <h1 class="recipedetails-title">${recipe.title}</h1>
                <div class="recipedetails-meta">
                    <div class="recipedetails-author">
                        <span class="recipedetails-author-icon">👨‍🍳</span>
                        <span>Created by <span class="recipedetails-author-name">${recipe.createdBy || 'Anonymous'}</span></span>
                    </div>
                    <span style="color: #999;">•</span>
                    <span style="color: #999;">${createdDate}</span>
                </div>
            </div>
            
            <div class="recipedetails-section">
                <h2 class="recipedetails-section-title">
                    <span class="recipedetails-section-icon">🥘</span>
                    Ingredients
                </h2>
                <ul class="recipedetails-ingredients-list">
                    ${ingredientsHTML}
                </ul>
            </div>
            
            <div class="recipedetails-section">
                <h2 class="recipedetails-section-title">
                    <span class="recipedetails-section-icon">📝</span>
                    Cooking Steps
                </h2>
                <ol class="recipedetails-steps-list">
                    ${stepsHTML}
                </ol>
            </div>
            
            <div class="recipedetails-actions">
                <button class="recipedetails-action-btn recipedetails-print-btn" onclick="printRecipe()">
                    🖨️ Print Recipe
                </button>
                <button class="recipedetails-action-btn recipedetails-share-btn" onclick="shareRecipe()">
                    📤 Share Recipe
                </button>
            </div>
        </div>
    `;
}

// Print recipe function
function printRecipe() {
    window.print();
}

// Share recipe function
function shareRecipe() {
    const recipeId = getRecipeId();
    
    if (!currentRecipe) {
        alert('Recipe not loaded yet');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: currentRecipe.title,
            text: `Check out this delicious recipe: ${currentRecipe.title}`,
            url: window.location.href
        }).catch(err => console.log('Share failed:', err));
    } else {
        // Fallback - copy link to clipboard
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Recipe link copied to clipboard!');
        }).catch(() => {
            alert('Unable to share. URL: ' + url);
        });
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Recipe details page loaded');
    
    // Check if user is logged in
    if (checkAuth()) {
        // Get recipe ID from URL
        const recipeId = getRecipeId();
        
        if (!recipeId) {
            // No ID provided, show error
            const content = document.getElementById('recipeContent');
            if (content) {
                content.innerHTML = `
                    <div class="recipedetails-error-state">
                        <div class="recipedetails-error-icon">⚠️</div>
                        <h2 class="recipedetails-error-title">No Recipe Selected</h2>
                        <p class="recipedetails-error-text">Please select a recipe from the home page.</p>
                        <button class="recipedetails-back-btn" onclick="window.location.href='Home.html'">
                            Back to Home
                        </button>
                    </div>
                `;
            }
        } else {
            // Load the recipe
            loadRecipe(recipeId);
        }
    }
});