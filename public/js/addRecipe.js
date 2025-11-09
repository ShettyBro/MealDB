// addRecipe.js

let selectedImageFile = null;

// Show message
function showMessage(message, type) {
  const messageEl = document.getElementById("addrecipeMessage");
  messageEl.textContent = message;
  messageEl.className = `addrecipe-message ${type} show`;

  if (type === "error") {
    setTimeout(() => {
      messageEl.classList.remove("show");
    }, 5000);
  }
}

// Handle image upload
document.getElementById("recipeImage").addEventListener("change", function (e) {
  const file = e.target.files[0];

  if (file) {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("Image size must be less than 5MB", "error");
      this.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage("Please upload a valid image file", "error");
      this.value = "";
      return;
    }

    selectedImageFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("previewImg").src = e.target.result;
      document.getElementById("imagePreview").classList.add("show");
      document.getElementById("uploadLabel").style.display = "none";
    };
    reader.readAsDataURL(file);
  }
});

// Remove image
function removeImage() {
  selectedImageFile = null;
  document.getElementById("recipeImage").value = "";
  document.getElementById("imagePreview").classList.remove("show");
  document.getElementById("uploadLabel").style.display = "flex";
}

// Handle cancel
function handleCancel() {
  if (
    confirm("Are you sure you want to cancel? All unsaved changes will be lost.")
  ) {
    window.location.href = "dashboard.html";
  }
}

// Handle form submission
document
  .getElementById("addRecipeForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("recipeTitle").value.trim();
    const ingredients = document.getElementById("recipeIngredients").value.trim();
    const steps = document.getElementById("recipeSteps").value.trim();

    // Validation
    if (!title || !ingredients || !steps || !selectedImageFile) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Saving...<span class="addrecipe-spinner"></span>';

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showMessage("Please log in to add recipes.", "error");
        setTimeout(() => (window.location.href = "login.html"), 1500);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", title);
      formData.append("ingredients", ingredients);
      formData.append("steps", steps);
      formData.append("image", selectedImageFile);

      // ✅ Use real deployed Netlify endpoint
      const response = await fetch(
        "https://mealdbs.netlify.app/.netlify/functions/createRecipe",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        showMessage("Recipe saved successfully! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "my-recipes.html";
        }, 1500);
      } else {
        showMessage(data.message || "Failed to save recipe", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Recipe";
      }
    } catch (error) {
      console.error("Add recipe error:", error);
      showMessage("An error occurred while saving the recipe.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Recipe";
    }
  });

// // ✅ Auth check (to prevent unauthorized access)
// function checkAuth() {
//   const token = localStorage.getItem("token");
//   if (!token) {
//     showMessage("Please log in to add a recipe.", "error");
//     setTimeout(() => (window.location.href = "login.html"), 1500);
//   }
// }

// // Initialize
// checkAuth();
