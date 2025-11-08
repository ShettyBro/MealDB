// Home Page 
  // Sample recipe data
        const recipes = [
            {
                id: 1,
                title: "Classic Margherita Pizza",
                image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop"
            },
            {
                id: 2,
                title: "Creamy Chicken Alfredo",
                image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&h=300&fit=crop"
            },
            {
                id: 3,
                title: "Chocolate Chip Cookies",
                image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop"
            },
            {
                id: 4,
                title: "Fresh Caesar Salad",
                image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop"
            },
            {
                id: 5,
                title: "Beef Tacos Supreme",
                image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop"
            },
            {
                id: 6,
                title: "Blueberry Pancakes",
                image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop"
            }
        ];

        // Check if user is logged in (stored in memory for this demo)
        let isLoggedIn = false;

        // Render recipe cards
        function renderRecipes() {
            const grid = document.getElementById('recipeGrid');
            grid.innerHTML = '';

            recipes.forEach(recipe => {
                const card = document.createElement('div');
                card.className = 'recipe-card';
                card.innerHTML = `
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
                    <div class="recipe-content">
                        <h3 class="recipe-title">${recipe.title}</h3>
                        <button class="view-btn" onclick="viewRecipe(${recipe.id})">View Details</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // View recipe details
        function viewRecipe(recipeId) {
            if (isLoggedIn) {
                window.location.href = `recipe.html?id=${recipeId}`;
            } else {
                document.getElementById('loginPopup').classList.add('active');
            }
        }

        // Close popup
        function closePopup() {
            document.getElementById('loginPopup').classList.remove('active');
        }

        renderRecipes();