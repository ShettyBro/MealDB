// myRecipes.js
let selectedImageFile = null;

// Check authentication
        function checkAuth() {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return false;
            }
            return true;
        }

        // Render recipes
        function renderRecipes() {
            const content = document.getElementById('dashboardContent');
            
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
                card.innerHTML = `
                    <img src="${recipe.image}" alt="${recipe.title}" class="dashboard-recipe-image">
                    <div class="dashboard-recipe-content">
                        <h3 class="dashboard-recipe-title">${recipe.title}</h3>
                        <p class="dashboard-recipe-description">${recipe.description}</p>
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
            window.location.href = `edit.html?id=${recipeId}`;
        }

        // Open delete modal
        function openDeleteModal(recipeId) {
            recipeToDelete = recipeId;
            document.getElementById('deleteModal').classList.add('active');
        }

        // Close delete modal
        function closeDeleteModal() {
            recipeToDelete = null;
            document.getElementById('deleteModal').classList.remove('active');
        }

        // Confirm delete
        async function confirmDelete() {
            if (recipeToDelete === null) return;

            try {
                // Simulate API call to delete recipe
                const response = await fetch(`/api/recipes/${recipeToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                // For demo, we'll just remove it from the array
                userRecipes = userRecipes.filter(recipe => recipe.id !== recipeToDelete);
                
                closeDeleteModal();
                renderRecipes();
                
                // Show success notification
                console.log('Recipe deleted successfully');
            } catch (error) {
                // For demo purposes, still delete it locally
                console.log('Simulating delete since API is not available...');
                userRecipes = userRecipes.filter(recipe => recipe.id !== recipeToDelete);
                
                closeDeleteModal();
                renderRecipes();
            }
        }

        // Handle logout
        function handleLogout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                window.location.href = 'login.html';
            }
        }

        // Close modal when clicking outside
        document.getElementById('deleteModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeDeleteModal();
            }
        });

        // Simulate loading recipes from API
        function loadRecipes() {
            const content = document.getElementById('dashboardContent');
            content.innerHTML = `
                <div class="dashboard-loading">
                    <div class="dashboard-spinner"></div>
                    <p style="margin-top: 1rem;">Loading your recipes...</p>
                </div>
            `;

            // Simulate API delay
            setTimeout(() => {
                renderRecipes();
            }, 800);
        }

        // Initialize
        if (checkAuth()) {
            loadRecipes();
        }