// addRecipe.js - Complete Version
let selectedImageFile = null;

// Get userId from localStorage
function getUserId() {
    return localStorage.getItem('userId');
}

// Show message
function showMessage(message, type) {
    const messageEl = document.getElementById('addrecipeMessage');
    if (!messageEl) return;
    
    messageEl.textContent = message;
    messageEl.className = `addrecipe-message ${type} show`;
    
    // Scroll to message
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide error messages after 5 seconds
    if (type === 'error') {
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }
}

// Handle image upload
const recipeImageInput = document.getElementById('recipeImage');
if (recipeImageInput) {
    recipeImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showMessage('Image size must be less than 5MB', 'error');
                this.value = '';
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showMessage('Please upload a valid image file (PNG, JPG, WEBP)', 'error');
                this.value = '';
                return;
            }

            selectedImageFile = file;

            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewImg = document.getElementById('previewImg');
                const imagePreview = document.getElementById('imagePreview');
                const uploadLabel = document.getElementById('uploadLabel');
                
                if (previewImg && imagePreview && uploadLabel) {
                    previewImg.src = e.target.result;
                    imagePreview.classList.add('show');
                    uploadLabel.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// Remove image function (called from HTML onclick)
function removeImage() {
    selectedImageFile = null;
    const recipeImageInput = document.getElementById('recipeImage');
    const imagePreview = document.getElementById('imagePreview');
    const uploadLabel = document.getElementById('uploadLabel');
    
    if (recipeImageInput) recipeImageInput.value = '';
    if (imagePreview) imagePreview.classList.remove('show');
    if (uploadLabel) uploadLabel.style.display = 'flex';
}

// Handle cancel function (called from HTML onclick)
function handleCancel() {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        window.location.href = 'my-recipes.html';
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

// Handle form submission
const addRecipeForm = document.getElementById('addRecipeForm');
if (addRecipeForm) {
    addRecipeForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Check if user is logged in
        const userId = getUserId();
        if (!userId) {
            showMessage('⚠️ User not logged in. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Get form values
        const titleInput = document.getElementById('recipeTitle');
        const ingredientsInput = document.getElementById('recipeIngredients');
        const stepsInput = document.getElementById('recipeSteps');

        const title = titleInput?.value.trim();
        const ingredients = ingredientsInput?.value.trim();
        const steps = stepsInput?.value.trim();

        // Validate all required fields
        if (!title) {
            showMessage('⚠️ Please enter a recipe title', 'error');
            titleInput?.focus();
            return;
        }

        if (!ingredients) {
            showMessage('⚠️ Please add ingredients', 'error');
            ingredientsInput?.focus();
            return;
        }

        if (!steps) {
            showMessage('⚠️ Please add cooking steps', 'error');
            stepsInput?.focus();
            return;
        }

        if (!selectedImageFile) {
            showMessage('⚠️ Please upload a recipe image', 'error');
            return;
        }

        // Get submit button
        const submitBtn = document.getElementById('submitBtn');
        const originalButtonText = submitBtn?.textContent || 'Save Recipe';
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '💾 Saving...<span class="addrecipe-spinner"></span>';
        }

        try {
            // Convert image to base64
            console.log('Converting image to base64...');
            const imageBase64 = await imageToBase64(selectedImageFile);

            // Prepare data
            const recipeData = {
                userId: parseInt(userId),
                title: title,
                imageBase64: imageBase64,
                ingredients: ingredients,
                steps: steps
            };

            console.log('Sending recipe to server...');

            // Send to API
            const response = await fetch('https://mealdbs.netlify.app/.netlify/functions/createRecipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipeData)
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (response.ok) {
                // Show success message
                showMessage('✅ Recipe saved successfully! Redirecting to My Recipes...', 'success');
                
                // Clear form
                addRecipeForm.reset();
                removeImage();
                
                // Redirect after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'my-recipes.html';
                }, 1500);
            } else {
                // Show error message from server
                showMessage('❌ ' + (data.message || 'Failed to save recipe. Please try again.'), 'error');
                
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalButtonText;
                }
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            showMessage('❌ Network error: ' + error.message + '. Please check your connection and try again.', 'error');
            
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalButtonText;
            }
        }
    });
}

// Handle logout button
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
            
            // Redirect to login
            window.location.href = 'login.html';
        }
    });
}

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const expirationTime = localStorage.getItem('tokenExpiration');
    
    // Check if token exists and is not expired
    if (!token || (expirationTime && Date.now() > expirationTime)) {
        // Token expired or missing - clear storage and redirect
        localStorage.clear();
        alert('Your session has expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    // Check if userId exists
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.warn('No userId found. User might need to login again.');
    }

    console.log('Page loaded. User authenticated.');
});