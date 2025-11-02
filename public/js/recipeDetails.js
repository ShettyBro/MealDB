// recipe details
 

        let isLoggedIn = false;

        // Check authentication on page load
        function checkAuth() {
            const token = localStorage.getItem('token');
            isLoggedIn = !!token;
            
            if (!isLoggedIn) {
                document.getElementById('loginOverlay').classList.add('show');
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
            
            // Show loading state
            content.innerHTML = `
                <div class="recipedetails-loading">
                    <div class="recipedetails-spinner"></div>
                    <p style="font-size: 1.1rem;">Loading delicious recipe...</p>
                </div>
            `;

            try {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Get recipe from database
                const recipe = recipesDatabase[id];
                
                if (!recipe) {
                    throw new Error('Recipe not found');
                }

                renderRecipe(recipe);
            } catch (error) {
                content.innerHTML = `
                    <div class="recipedetails-error-state">
                        <div class="recipedetails-error-icon">🔍</div>
                        <h2 class="recipedetails-error-title">Recipe Not Found</h2>
                        <p class="recipedetails-error-text">We couldn't find the recipe you're looking for. It may have been removed or doesn't exist.</p>
                        <button class="recipedetails-back-btn" onclick="window.location.href='index.html'">
                            Back to Home
                        </button>
                    </div>
                `;
            }
        }

        // Render recipe details to the page
        function renderRecipe(recipe) {
            const content = document.getElementById('recipeContent');
            
            // Generate ingredients HTML
            const ingredientsHTML = recipe.ingredients.map(ingredient => `
                <li class="recipedetails-ingredient-item">
                    <span class="recipedetails-ingredient-bullet">✓</span>
                    <span>${ingredient}</span>
                </li>
            `).join('');
            
            // Generate steps HTML
            const stepsHTML = recipe.steps.map(step => `
                <li class="recipedetails-step-item">
                    <div class="recipedetails-step-number"></div>
                    <div class="recipedetails-step-text">${step}</div>
                </li>
            `).join('');
            
            // Render complete recipe
            content.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}" class="recipedetails-hero-image">
                
                <div class="recipedetails-content">
                    <div class="recipedetails-header">
                        <h1 class="recipedetails-title">${recipe.title}</h1>
                        <div class="recipedetails-meta">
                            <div class="recipedetails-author">
                                <span class="recipedetails-author-icon">👨‍🍳</span>
                                <span>Created by <span class="recipedetails-author-name">${recipe.createdBy}</span></span>
                            </div>
                        </div>
                    </div>
                    
                    <p class="recipedetails-description">${recipe.description}</p>
                    
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
            const recipe = recipesDatabase[recipeId];
            
            if (navigator.share) {
                navigator.share({
                    title: recipe.title,
                    text: `Check out this delicious recipe: ${recipe.title}`,
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
            // Check if user is logged in
            if (checkAuth()) {
                // Get recipe ID from URL
                const recipeId = getRecipeId();
                
                if (!recipeId) {
                    // No ID provided, show error
                    document.getElementById('recipeContent').innerHTML = `
                        <div class="recipedetails-error-state">
                            <div class="recipedetails-error-icon">❌</div>
                            <h2 class="recipedetails-error-title">No Recipe Selected</h2>
                            <p class="recipedetails-error-text">Please select a recipe from the home page.</p>
                            <button class="recipedetails-back-btn" onclick="window.location.href='index.html'">
                                Back to Home
                            </button>
                        </div>
                    `;
                } else {
                    // Load the recipe
                    loadRecipe(recipeId);
                }
            }
        });