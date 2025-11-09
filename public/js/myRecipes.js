// myRecipes.js - Fixed to show recipes AND delete properly

let userRecipes = [];
let recipeToDelete = null;

// Get userId from localStorage
function getUserId() {
    return localStorage.getItem('userId');
}

// Fetch user's recipes
async function fetchMyRecipes() {
    const content = document.getElementById('dashboardContent');
    const userId = getUserId();

    if (!userId) {
        console.error('No userId found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    // Show loading state
    if (content) {
        content.innerHTML = `
            <div class="dashboard-loading">
                <div class="dashboard-spinner"></div>
                <p style="margin-top: 1rem;">Loading your recipes...</p>
            </div>
        `;
    }

    try {
        console.log(`Fetching recipes for userId: ${userId}...`);
        const response = await fetch(`https://mealdbs.netlify.app/.netlify/functions/getMyRecipes?userId=${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipes');
        }

        const data = await response.json();
        console.log('User recipes fetched:', data);

        userRecipes = data.recipes || [];
        renderRecipes();

    } catch (error) {
        console.error('Error fetching user recipes:', error);
        if (content) {
            content.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #dc3545;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h2 style="margin-bottom: 0.5rem;">Failed to Load Recipes</h2>
                    <p style="color: #666; margin-bottom: 1rem;">Please check your connection and try again.</p>
                    <button onclick="fetchMyRecipes()" class="dashboard-add-btn">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// Render recipes
function renderRecipes() {
    const content = document.getElementById('dashboardContent');
    
    if (!content) return;

    if (userRecipes.length === 0) {
        content.innerHTML = `
            <div class="dashboard-empty-state">
                <div class="dashboard-empty-icon">🍳</div>
                <h2 class="dashboard-empty-title">No Recipes Yet</h2>
                <p class="dashboard-empty-text">Start by adding your first recipe!</p>
                <button class="dashboard-add-btn" onclick="window.location.href='add-recipe.html'">
                    <span class="dashboard-add-icon">+</span>
                    Add Your First Recipe
                </button>
            </div>
        `;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'dashboard-recipe-grid';

    userRecipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'dashboard-recipe-card';
        
        // Use image URL from database or fallback
        const imageUrl = recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
        
        // Create description from ingredients (first 100 chars)
        const description = recipe.ingredients ? 
            recipe.ingredients.substring(0, 100) + (recipe.ingredients.length > 100 ? '...' : '') 
            : 'No ingredients listed';

        card.innerHTML = `
            <img src="${imageUrl}" alt="${recipe.title}" class="dashboard-recipe-image" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'">
            <div class="dashboard-recipe-content">
                <h3 class="dashboard-recipe-title">${recipe.title}</h3>
                <p class="dashboard-recipe-description">${description}</p>
                <div class="dashboard-recipe-actions">
                    <button class="dashboard-edit-btn" onclick="editRecipe(${recipe.id})">Edit</button>
                    <button class="dashboard-delete-btn" onclick="openDeleteModal(${recipe.id})">Delete</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    content.innerHTML = '';
    content.appendChild(grid);
}

// Edit recipe
function editRecipe(recipeId) {
    window.location.href = `edit-recipe.html?id=${recipeId}`;
}

// Open delete modal
function openDeleteModal(recipeId) {
    recipeToDelete = recipeId;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close delete modal
function closeDeleteModal() {
    recipeToDelete = null;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Confirm delete - FIXED to send ID as query parameter
async function confirmDelete() {
    if (recipeToDelete === null) {
        alert('No recipe selected for deletion');
        return;
    }

    try {
        console.log(`Deleting recipe ID: ${recipeToDelete}...`);
        
        // CRITICAL FIX: Send ID as query parameter, NOT in body
        const response = await fetch(
            `https://mealdbs.netlify.app/.netlify/functions/deleteRecipe?id=${recipeToDelete}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
                // NO BODY - ID is in the URL as query parameter
            }
        );

        const data = await response.json();
        console.log('Delete response:', data);

        if (response.ok && data.success) {
            console.log('✅ Recipe deleted successfully:', data.recipeName);
            
            // Remove from local array
            userRecipes = userRecipes.filter(recipe => recipe.id !== recipeToDelete);
            
            closeDeleteModal();
            renderRecipes();
            
            // Show success message
            showSuccessMessage(`✅ Recipe "${data.recipeName}" deleted successfully!`);
        } else {
            throw new Error(data.message || 'Failed to delete recipe');
        }
    } catch (error) {
        console.error('❌ Error deleting recipe:', error);
        alert(`Failed to delete recipe: ${error.message}`);
        closeDeleteModal();
    }
}

// Show success message
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #d4edda;
        color: #155724;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        border: 1px solid #c3e6cb;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Close modal when clicking outside
const deleteModal = document.getElementById('deleteModal');
if (deleteModal) {
    deleteModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDeleteModal();
        }
    });
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
            
            console.log('✅ User logged out successfully');
            
            // Redirect to login
            window.location.href = 'login.html';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 My Recipes page loaded');
    console.log('👤 User ID:', getUserId());
    fetchMyRecipes();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .dashboard-loading {
        text-align: center;
        padding: 3rem;
        color: #666;
    }
    
    .dashboard-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #ff6b6b;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);