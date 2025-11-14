// editRecipe.js 
let currentRecipe = null;
let selectedImageFile = null;
let recipeId = null;

// Get recipe ID from URL
function getRecipeId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Show message
function showMessage(message, type) {
    const messageEl = document.getElementById('editrecipeMessage');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `editrecipe-message ${type} show`;
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        if (type === 'error') {
            setTimeout(() => {
                messageEl.classList.remove('show');
            }, 5000);
        }
    }
}

// Convert image to base64
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Load recipe data from API
async function loadRecipe(id) {
    const content = document.getElementById('editrecipeContent');
    
    // Show loading state
    content.innerHTML = `
        <div class="editrecipe-loading">
            <div class="editrecipe-spinner"></div>
            <p>Loading recipe...</p>
        </div>
    `;

    try {
        console.log(`Fetching recipe ID: ${id}`);
        
        // Fetch from real API
        const response = await fetch(`https://mealdbs.netlify.app/.netlify/functions/getRecipeById?id=${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load recipe`);
        }
        
        const data = await response.json();
        console.log('Recipe loaded:', data);
        
        if (!data.recipe) {
            throw new Error('Recipe not found');
        }

        currentRecipe = data.recipe;
        renderForm(data.recipe);
        
    } catch (error) {
        console.error('Error loading recipe:', error);
        content.innerHTML = `
            <div class="editrecipe-error-state">
                <div class="editrecipe-error-icon">❌</div>
                <h2 class="editrecipe-error-title">Recipe Not Found</h2>
                <p class="editrecipe-error-text">${error.message}</p>
                <button class="editrecipe-back-btn" onclick="window.location.href='my-recipes.html'">
                    Back to My Recipes
                </button>
            </div>
        `;
    }
}

// Render form with recipe data
function renderForm(recipe) {
    const content = document.getElementById('editrecipeContent');
    content.innerHTML = `
        <div id="editrecipeMessage" class="editrecipe-message"></div>

        <form id="editRecipeForm" class="editrecipe-form">
            <!-- Recipe Title -->
            <div class="editrecipe-form-group">
                <label for="recipeTitle" class="editrecipe-label">
                    Recipe Title <span class="editrecipe-required">*</span>
                </label>
                <input 
                    type="text" 
                    id="recipeTitle" 
                    name="title" 
                    class="editrecipe-input" 
                    placeholder="e.g., Chocolate Chip Cookies"
                    value="${recipe.title || ''}"
                    required
                >
            </div>

            <!-- Image Upload -->
            <div class="editrecipe-form-group">
                <label class="editrecipe-label">
                    Recipe Image
                </label>
                <div class="editrecipe-image-upload">
                    <input 
                        type="file" 
                        id="recipeImage" 
                        name="image" 
                        accept="image/*"
                        class="editrecipe-file-input"
                    >
                    <label for="recipeImage" class="editrecipe-upload-label" id="uploadLabel" style="display: none;">
                        <div class="editrecipe-upload-icon">📷</div>
                        <div class="editrecipe-upload-text">
                            <strong>Click to upload new image</strong> or drag and drop
                        </div>
                        <div class="editrecipe-upload-hint">PNG, JPG or WEBP (max. 5MB)</div>
                    </label>
                    <div class="editrecipe-image-preview show" id="imagePreview">
                        <img id="previewImg" class="editrecipe-preview-img" src="${recipe.image || ''}" alt="Preview">
                        <button type="button" class="editrecipe-remove-image" onclick="showUploadLabel()">Change Image</button>
                    </div>
                </div>
                <p class="editrecipe-image-note">Current image shown. Upload a new one to replace it (optional).</p>
            </div>

            <!-- Ingredients -->
            <div class="editrecipe-form-group">
                <label for="recipeIngredients" class="editrecipe-label">
                    Ingredients <span class="editrecipe-required">*</span>
                </label>
                <textarea 
                    id="recipeIngredients" 
                    name="ingredients" 
                    class="editrecipe-textarea" 
                    placeholder="List all ingredients (one per line)"
                    required
                >${recipe.ingredients || ''}</textarea>
                <p class="editrecipe-helper-text">Tip: List each ingredient on a new line</p>
            </div>

            <!-- Steps -->
            <div class="editrecipe-form-group">
                <label for="recipeSteps" class="editrecipe-label">
                    Cooking Steps <span class="editrecipe-required">*</span>
                </label>
                <textarea 
                    id="recipeSteps" 
                    name="steps" 
                    class="editrecipe-textarea" 
                    placeholder="Describe the cooking steps"
                    required
                    style="min-height: 150px;"
                >${recipe.steps || ''}</textarea>
                <p class="editrecipe-helper-text">Tip: Number each step for clarity</p>
            </div>

            <!-- Buttons -->
            <div class="editrecipe-button-group">
                <button type="button" class="editrecipe-cancel-btn" onclick="handleCancel()">
                    Cancel
                </button>
                <button type="submit" id="submitBtn" class="editrecipe-submit-btn">
                    Update Recipe
                </button>
            </div>
        </form>
    `;

    // Attach event listeners
    attachEventListeners();
}

// Show upload label for changing image
function showUploadLabel() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadLabel').style.display = 'flex';
}

// Attach event listeners
function attachEventListeners() {
    // Image upload handler
    const imageInput = document.getElementById('recipeImage');
    if (imageInput) {
        imageInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // Validate file size
                if (file.size > 5 * 1024 * 1024) {
                    showMessage('Image size must be less than 5MB', 'error');
                    this.value = '';
                    return;
                }

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showMessage('Please upload a valid image file', 'error');
                    this.value = '';
                    return;
                }

                selectedImageFile = file;

                // Show preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('previewImg').src = e.target.result;
                    document.getElementById('imagePreview').style.display = 'block';
                    document.getElementById('imagePreview').classList.add('show');
                    document.getElementById('uploadLabel').style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Form submission handler
    const form = document.getElementById('editRecipeForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

// Handle cancel
function handleCancel() {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        window.location.href = 'my-recipes.html';
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('recipeTitle')?.value.trim();
    const ingredients = document.getElementById('recipeIngredients')?.value.trim();
    const steps = document.getElementById('recipeSteps')?.value.trim();

    // Validation
    if (!title || !ingredients || !steps) {
        showMessage('⚠️ Please fill in all required fields', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn?.textContent || 'Update Recipe';
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '💾 Updating...<span class="editrecipe-spinner-small"></span>';
    }

    try {
        // Prepare update data
        const updateData = {
            title: title,
            ingredients: ingredients,
            steps: steps
        };

        // Add new image if uploaded
        if (selectedImageFile) {
            console.log('Converting new image to base64...');
            const imageBase64 = await imageToBase64(selectedImageFile);
            updateData.imageBase64 = imageBase64;
        }

        console.log('Sending update request...');

        // Send update to API
        const response = await fetch(`https://mealdbs.netlify.app/.netlify/functions/updateRecipe?id=${recipeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();
        console.log('Update response:', data);

        if (response.ok && data.success) {
                // Show popup popup instead of redirect
                showSuccessPopup();

           
        } else {
            showMessage('❌ ' + (data.message || 'Failed to update recipe'), 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    } catch (error) {
        console.error('Error updating recipe:', error);
        showMessage('❌ Error: ' + error.message, 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        recipeId = getRecipeId();
        
        if (!recipeId) {
            document.getElementById('editrecipeContent').innerHTML = `
                <div class="editrecipe-error-state">
                    <div class="editrecipe-error-icon">⚠️</div>
                    <h2 class="editrecipe-error-title">No Recipe ID</h2>
                    <p class="editrecipe-error-text">Please select a recipe to edit.</p>
                    <button class="editrecipe-back-btn" onclick="window.location.href='my-recipes.html'">
                        Back to My Recipes
                    </button>
                </div>
            `;
        } else {
            loadRecipe(recipeId);
        }
    }
});
function showSuccessPopup() {
    const popup = document.getElementById('successPopup');
    if (popup) popup.style.display = 'flex';
}

function closeSuccessPopup() {
    const popup = document.getElementById('successPopup');
    if (popup) popup.style.display = 'none';

    // Redirect after closing
    window.location.href = 'my-recipes.html';
}