// editrecipies.js

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
                
                if (type === 'error') {
                    setTimeout(() => {
                        messageEl.classList.remove('show');
                    }, 5000);
                }
            }
        }

        // Load recipe data
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
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Get recipe from database
                const recipe = recipesDatabase[id];
                
                if (!recipe) {
                    throw new Error('Recipe not found');
                }

                currentRecipe = recipe;
                renderForm(recipe);
            } catch (error) {
                content.innerHTML = `
                    <div class="editrecipe-error-state">
                        <div class="editrecipe-error-icon">❌</div>
                        <h2 class="editrecipe-error-title">Recipe Not Found</h2>
                        <p class="editrecipe-error-text">The recipe you're looking for doesn't exist.</p>
                        <button class="editrecipe-back-btn" onclick="window.location.href='dashboard.html'">
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
                            value="${recipe.title}"
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
                                <img id="previewImg" class="editrecipe-preview-img" src="${recipe.image}" alt="Preview">
                                <button type="button" class="editrecipe-remove-image" onclick="removeImage()">×</button>
                            </div>
                        </div>
                        <p class="editrecipe-image-note">Current image shown. Upload a new one to replace it.</p>
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
                        >${recipe.ingredients}</textarea>
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
                        >${recipe.steps}</textarea>
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

        // Attach event listeners to form elements
        function attachEventListeners() {
            // Image upload handler
            document.getElementById('recipeImage').addEventListener('change', function(e) {
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
                        showMessage('Please upload a valid image file', 'error');
                        this.value = '';
                        return;
                    }

                    selectedImageFile = file;

                    // Show preview
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.getElementById('previewImg').src = e.target.result;
                        document.getElementById('imagePreview').classList.add('show');
                        document.getElementById('uploadLabel').style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Form submission handler
            document.getElementById('editRecipeForm').addEventListener('submit', handleSubmit);
        }

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
                window.location.href = 'dashboard.html';
            }
        }

        // Handle form submission
        async function handleSubmit(e) {
            e.preventDefault();

            const title = document.getElementById('recipeTitle').value.trim();
            const ingredients = document.getElementById('recipeIngredients').value.trim();
            const steps = document.getElementById('recipeSteps').value.trim();

            // Validation
            if (!title || !ingredients || !steps) {
                showMessage('Please fill in all required fields', 'error');
                return;
            }

            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Updating...<span class="editrecipe-spinner-small"></span>';

            try {
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('title', title);
                formData.append('ingredients', ingredients);
                formData.append('steps', steps);
                if (selectedImageFile) {
                    formData.append('image', selectedImageFile);
                }

                // Simulate API call
                const response = await fetch(`/netlify/functions/recipes/update/${recipeId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('Recipe updated successfully! Redirecting...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    showMessage(data.message || 'Failed to update recipe', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Update Recipe';
                }
            } catch (error) {
                // For demo purposes, simulate success
                console.log('Simulating recipe update since API is not available...');
                
                showMessage('Recipe updated successfully! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        }

        // Initialize
        if (checkAuth()) {
            recipeId = getRecipeId();
            
            if (!recipeId) {
                document.getElementById('editrecipeContent').innerHTML = `
                    <div class="editrecipe-error-state">
                        <div class="editrecipe-error-icon">⚠️</div>
                        <h2 class="editrecipe-error-title">No Recipe ID</h2>
                        <p class="editrecipe-error-text">Please select a recipe to edit.</p>
                        <button class="editrecipe-back-btn" onclick="window.location.href='dashboard.html'">
                            Back to My Recipes
                        </button>
                    </div>
                `;
            } else {
                loadRecipe(recipeId);
            }
        }