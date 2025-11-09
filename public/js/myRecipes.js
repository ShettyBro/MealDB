// myRecipes.js - Fixed version with better error handling
let userRecipes = [];
let recipeToDelete = null;

// Get userId from localStorage
function getUserId() {
    return localStorage.getItem('userId');
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const expirationTime = localStorage.getItem('tokenExpiration');
    
    if (!token || (expirationTime && Date.now() > expirationTime)) {
        localStorage.clear();
        alert('Your session has expired. Please login again.');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Fetch user's recipes
async function fetchUserRecipes() {
    const userId = getUserId();
    
    if (!userId) {
        console.error('No userId found');
        window.location.href = 'login.html';
        return;
    }

    const recipesGrid = document.getElementById('dashboardRecipesGrid');
    const loadingEl = document.getElementById('dashboardLoading');
    const emptyState = document.getElementById('dashboardEmptyState');

    // Show loading
    if (loadingEl) loadingEl.style.display = 'block';
    if (recipesGrid) recipesGrid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    try {
        console.log(`Fetching recipes for user ${userId}...`);
        
        const response = await fetch(`https://mealdbs.netlify.app/.netlify/functions/getMyRecipes?userId=${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch recipes`);
        }

        const data = await response.json();
        console.log('Recipes fetched:', data);

        userRecipes = data.recipes || [];

        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';

        if (userRecipes.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            displayRecipes(userRecipes);
        }

    } catch (error) {
        console.error('Error fetching recipes:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        
        if (recipesGrid) {
            recipesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    <p style="color: #dc3545; font-size: 1.1rem;">❌ ${error.message}</p>
                    <button onclick="fetchUserRecipes()" 
                            style="margin-top: 1rem; padding: 0.75rem 1.5rem; 
                                   background: #d4af37; color: white; border: none; 
                                   border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
            recipesGrid.style.display = 'grid';
        }
    }
}

// Display recipes
function displayRecipes(recipes) {
    const recipesGrid = document.getElementById('dashboardRecipesGrid');
    
    if (!recipesGrid) return;

    recipesGrid.innerHTML = recipes.map(recipe => `
        <div class="dashboard-recipe-card" data-recipe-id="${recipe.id}">
            <img src="${recipe.image || 'https://via.placeholder.com/400x200?text=No+Image'}" 
                 alt="${recipe.title}" 
                 class="dashboard-recipe-image"
                 onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
            <div class="dashboard-recipe-content">
                <h3 class="dashboard-recipe-title">${recipe.title}</h3>
                <p class="dashboard-recipe-description">
                    ${recipe.ingredients ? recipe.ingredients.substring(0, 100) + '...' : 'No description'}
                </p>
                <div class="dashboard-recipe-actions">
                    <button class="dashboard-edit-btn" onclick="editRecipe(${recipe.id})">
                        Edit
                    </button>
                    <button class="dashboard-delete-btn" onclick="confirmDelete(${recipe.id}, '${recipe.title.replace(/'/g, "\\'")}')">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    recipesGrid.style.display = 'grid';
}

// Edit recipe
function editRecipe(recipeId) {
    window.location.href = `edit-recipe.html?id=${recipeId}`;
}

// Confirm delete
function confirmDelete(recipeId, recipeTitle) {
    recipeToDelete = recipeId;
    const modal = document.getElementById('dashboardModal');
    const modalText = document.getElementById('dashboardModalText');
    
    if (modalText) {
        modalText.textContent = `Are you sure you want to delete "${recipeTitle}"? This action cannot be undone.`;
    }
    
    if (modal) {
        modal.classList.add('active');
    }
}

// Cancel delete
function cancelDelete() {
    recipeToDelete = null;
    const modal = document.getElementById('dashboardModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Delete recipe
async function deleteRecipe() {
    if (!recipeToDelete) return;

    const confirmBtn = document.getElementById('dashboardConfirmDelete');
    const originalText = confirmBtn?.textContent || 'Delete';
    
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';
    }

    try {
        console.log(`Deleting recipe ID: ${recipeToDelete}`);

        const response = await fetch(`https://mealdbs.netlify.app/.netlify/functions/deleteRecipe?id=${recipeToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        console.log('Delete response:', data);

        if (response.ok && data.success) {
            console.log('Recipe deleted successfully');
            
            // Remove from UI with animation
            const card = document.querySelector(`[data-recipe-id="${recipeToDelete}"]`);
            if (card) {
                card.style.transform = 'scale(0.8)';
                card.style.opacity = '0';
                setTimeout(() => {
                    card.remove();
                    
                    // Update recipes array
                    userRecipes = userRecipes.filter(r => r.id !== recipeToDelete);
                    
                    // Check if empty
                    if (userRecipes.length === 0) {
                        const emptyState = document.getElementById('dashboardEmptyState');
                        const recipesGrid = document.getElementById('dashboardRecipesGrid');
                        if (emptyState) emptyState.style.display = 'block';
                        if (recipesGrid) recipesGrid.style.display = 'none';
                    }
                }, 300);
            }

            // Close modal
            cancelDelete();
            
            // Show success alert
            alert('✅ Recipe deleted successfully!');
            
        } else {
            throw new Error(data.message || 'Failed to delete recipe');
        }

    } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Failed to delete recipe: ' + error.message);
        
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    }
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        console.log('User authenticated, fetching recipes...');
        fetchUserRecipes();
        
        // Setup logout button
        const logoutBtn = document.getElementById('dashboardLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Setup modal buttons
        const cancelBtn = document.getElementById('dashboardCancelDelete');
        const confirmBtn = document.getElementById('dashboardConfirmDelete');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelDelete);
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', deleteRecipe);
        }
    }
});