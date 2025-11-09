// addRecipe.js
let selectedImageFile = null;

// Get userId from localStorage
function getUserId() {
    return localStorage.getItem('userId');
}

// Show message
function showMessage(message, type) {
    const messageEl = document.getElementById('addrecipeMessage');
    messageEl.textContent = message;
    messageEl.className = `addrecipe-message ${type} show`;
    
    if (type === 'error') {
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }
}

// Handle image upload
document.getElementById('recipeImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Image size must be less than 5MB', 'error');
            this.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            showMessage('Please upload a valid image file', 'error');
            this.value = '';
            return;
        }

        selectedImageFile = file;

        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').classList.add('show');
            document.getElementById('uploadLabel').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

// Remove image
function removeImage() {
    selectedImageFile = null;
    document.getElementById('recipeImage').value = '';
    document.getElementById('imagePreview').classList.remove('show');
    document.getElementById('uploadLabel').style.display = 'flex';
}

// Handle cancel
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
document.getElementById('addRecipeForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const userId = getUserId();
    if (!userId) {
        showMessage('User not logged in. Please login again.', 'error');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }

    const title = document.getElementById('recipeTitle').value.trim();
    const ingredients = document.getElementById('recipeIngredients').value.trim();
    const steps = document.getElementById('recipeSteps').value.trim();

    if (!title || !ingredients || !steps || !selectedImageFile) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Saving...<span class="addrecipe-spinner"></span>';

    try {
        // Convert image to base64
        const imageBase64 = await imageToBase64(selectedImageFile);

        // Prepare data
        const recipeData = {
            userId: parseInt(userId),
            title: title,
            imageBase64: imageBase64,
            ingredients: ingredients,
            steps: steps
        };

        console.log('Sending recipe data...');

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
            showMessage('Recipe saved successfully! Redirecting...', 'success');
            
            document.getElementById('addRecipeForm').reset();
            removeImage();
            
            setTimeout(() => {
                window.location.href = 'my-recipes.html';
            }, 1500);
        } else {
            showMessage(data.message || 'Failed to save recipe', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Recipe';
        }
    } catch (error) {
        console.error('Error saving recipe:', error);
        showMessage('Error: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Recipe';
    }
});
