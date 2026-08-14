const productForm = document.querySelector("#product-form");
const productFeedback = document.querySelector("#product-feedback");
const adminProducts = document.querySelector("#admin-products");
const ordersList = document.querySelector("#orders-list");
const priceBookRows = document.querySelector("#price-book-rows");
const recipeRows = document.querySelector("#recipe-rows");
const addPriceItemButton = document.querySelector("#add-price-item");
const addRecipeIngredientButton = document.querySelector("#add-recipe-ingredient");
const productNameInput = document.querySelector("#cost-product-name");
const savedRecipeSelect = document.querySelector("#saved-recipe-select");
const newRecipeButton = document.querySelector("#new-recipe");
const saveRecipeButton = document.querySelector("#save-recipe");
const recipeSaveFeedback = document.querySelector("#recipe-save-feedback");
const productEditDialog = document.querySelector("#product-edit-dialog");
const productEditForm = document.querySelector("#product-edit-form");
const productEditTitle = document.querySelector("#product-edit-title");
const productEditFeedback = document.querySelector("#product-edit-feedback");
const translationFeedback = document.querySelector("#translation-feedback");
const translateNewProductButton = document.querySelector("#translate-new-product");
const translateEditProductButton = document.querySelector("#translate-edit-product");
const editImageFile = document.querySelector("#edit-image-file");
const adminLogin = document.querySelector("#admin-login");
const adminMain = document.querySelector("#admin-main");
const adminLoginForm = document.querySelector("#admin-login-form");
const adminPasswordInput = document.querySelector("#admin-password");
const adminLoginFeedback = document.querySelector("#admin-login-feedback");
const adminLogoutButton = document.querySelector("#admin-logout");
let editingProductId = "";
let uploadedEditImageData = "";
const translationTimers = new Map();
const costingInputs = {
  yield: document.querySelector("#cost-yield"),
  salePrice: document.querySelector("#cost-sale-price"),
  ovenPower: document.querySelector("#cost-oven-power"),
  ovenHours: document.querySelector("#cost-oven-hours"),
  electricityRate: document.querySelector("#cost-electricity-rate"),
};
const costingResults = {
  ingredients: document.querySelector("#cost-ingredients"),
  electricity: document.querySelector("#cost-electricity"),
  batch: document.querySelector("#cost-batch"),
  unit: document.querySelector("#cost-unit"),
  profitUnit: document.querySelector("#cost-profit-unit"),
  margin: document.querySelector("#cost-margin"),
  profitBatch: document.querySelector("#cost-profit-batch"),
};

let productState = [];
let uploadedImageData = "";
const costingStorageKey = "mochi-costing-draft";
const priceBookStorageKey = "mochi-price-book";
const productRecipesStorageKey = "mochi-product-recipes";
let priceBook = [];
let recipeIngredients = [];
let productRecipes = [];
let currentRecipeId = "";
let costingSaveTimer;

function money(value) {
  return `€${value.toFixed(2)}`;
}

function emptyPriceItem() {
  return { name: "", packSize: 1000, packPrice: 0 };
}

function emptyRecipeIngredient() {
  return { materialId: "", amount: 0 };
}

function loadCostingDraft() {
  try {
    const savedCosting = JSON.parse(localStorage.getItem(costingStorageKey) || "null");
    const savedPriceBook = JSON.parse(localStorage.getItem(priceBookStorageKey) || "null");
    const savedProductRecipes = JSON.parse(localStorage.getItem(productRecipesStorageKey) || "null");
    if (savedPriceBook?.length) {
      priceBook = savedPriceBook;
    } else {
      priceBook = [emptyPriceItem()];
    }
    if (savedCosting?.recipeIngredients?.length) {
      recipeIngredients = savedCosting.recipeIngredients;
    } else {
      recipeIngredients = [emptyRecipeIngredient()];
    }
    productRecipes = Array.isArray(savedProductRecipes) ? savedProductRecipes : [];
    Object.entries(costingInputs).forEach(([key, input]) => {
      if (savedCosting?.[key] !== undefined) {
        input.value = savedCosting[key];
      }
    });
  } catch {
    priceBook = [emptyPriceItem()];
    recipeIngredients = [emptyRecipeIngredient()];
    productRecipes = [];
  }
}

function saveCostingDraft() {
  const draft = {
    recipeIngredients,
    ...Object.fromEntries(Object.entries(costingInputs).map(([key, input]) => [key, input.value])),
  };
  localStorage.setItem(costingStorageKey, JSON.stringify(draft));
  localStorage.setItem(priceBookStorageKey, JSON.stringify(priceBook));
  localStorage.setItem(productRecipesStorageKey, JSON.stringify(productRecipes));
  clearTimeout(costingSaveTimer);
  costingSaveTimer = setTimeout(async () => {
    try {
      await fetch("/api/costing-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: priceBook, recipes: productRecipes }),
      });
    } catch {
      // Keep the local draft if the database is temporarily unavailable.
    }
  }, 400);
}

async function loadCostingDataFromServer() {
  try {
    const response = await fetch("/api/costing-data");
    if (!response.ok) return;
    const saved = await response.json();
    const hasServerData = saved.ingredients?.length || saved.recipes?.length;
    if (hasServerData) {
      priceBook = saved.ingredients;
      productRecipes = saved.recipes;
      localStorage.setItem(priceBookStorageKey, JSON.stringify(priceBook));
      localStorage.setItem(productRecipesStorageKey, JSON.stringify(productRecipes));
    } else if (priceBook.length || productRecipes.length) {
      saveCostingDraft();
    }
  } catch {
    // Fall back to the local draft for offline development.
  }
}

function renderSavedRecipes() {
  savedRecipeSelect.innerHTML = `<option value="">Choose a saved product</option>${productRecipes
    .map((recipe) => `<option value="${recipe.id}" ${recipe.id === currentRecipeId ? "selected" : ""}>${recipe.name}</option>`)
    .join("")}`;
}

function snapshotCurrentRecipe() {
  return {
    id: currentRecipeId || `recipe-${Date.now()}`,
    name: productNameInput.value.trim(),
    recipeIngredients: JSON.parse(JSON.stringify(recipeIngredients)),
    ...Object.fromEntries(Object.entries(costingInputs).map(([key, input]) => [key, input.value])),
  };
}

function loadRecipe(recipe) {
  currentRecipeId = recipe.id;
  productNameInput.value = recipe.name;
  recipeIngredients = JSON.parse(JSON.stringify(recipe.recipeIngredients));
  Object.entries(costingInputs).forEach(([key, input]) => {
    if (recipe[key] !== undefined) input.value = recipe[key];
  });
  renderRecipeIngredients();
  calculateCosting();
  renderSavedRecipes();
}

function resetRecipe() {
  currentRecipeId = "";
  productNameInput.value = "";
  recipeIngredients = [emptyRecipeIngredient()];
  renderRecipeIngredients();
  calculateCosting();
  renderSavedRecipes();
  clearFeedback(recipeSaveFeedback);
}

function renderPriceBook() {
  priceBookRows.innerHTML = priceBook
    .map(
      (item, index) => `
        <div class="ingredient-row price-book-row" data-price-index="${index}">
          <label>
            Raw material
            <input data-price-field="name" type="text" value="${item.name}" placeholder="e.g. Flour" />
          </label>
          <label>
            Pack size (g)
            <input data-price-field="packSize" type="number" min="0" step="1" value="${item.packSize}" />
          </label>
          <label>
            Pack price (EUR)
            <input data-price-field="packPrice" type="number" min="0" step="0.01" value="${item.packPrice}" />
          </label>
          <button class="ingredient-remove" type="button" data-remove-price="${index}" aria-label="Remove raw material">×</button>
        </div>
      `
    )
    .join("");
}

function renderRecipeIngredients() {
  recipeRows.innerHTML = recipeIngredients
    .map(
      (ingredient, index) => `
        <div class="ingredient-row recipe-row" data-recipe-index="${index}">
          <label>
            Raw material
            <select data-recipe-field="materialId">
              <option value="">Choose a material</option>
              ${priceBook
                .map((item, itemIndex) => item.name.trim() ? `<option value="${itemIndex}" ${String(itemIndex) === String(ingredient.materialId) ? "selected" : ""}>${item.name}</option>` : "")
                .join("")}
            </select>
          </label>
          <label>
            Used in recipe (g)
            <input data-recipe-field="amount" type="number" min="0" step="any" inputmode="decimal" value="${ingredient.amount}" />
          </label>
          <div class="recipe-cost" data-recipe-cost="${index}">${money(recipeIngredientCost(ingredient))}</div>
          <button class="ingredient-remove" type="button" data-remove-recipe="${index}" aria-label="Remove recipe ingredient">×</button>
        </div>
      `
    )
    .join("");
}

function recipeIngredientCost(ingredient) {
  const item = priceBook[Number(ingredient.materialId)];
  const amount = Number(ingredient.amount) || 0;
  if (!item || !Number(item.packSize) || !Number(item.packPrice)) return 0;
  return (amount / Number(item.packSize)) * Number(item.packPrice);
}

function calculateCosting() {
  const ingredientCost = recipeIngredients.reduce((total, ingredient) => total + recipeIngredientCost(ingredient), 0);
  const yieldCount = Math.max(1, Number(costingInputs.yield.value) || 1);
  const salePrice = Math.max(0, Number(costingInputs.salePrice.value) || 0);
  const energyKwh =
    Math.max(0, Number(costingInputs.ovenPower.value) || 0) *
    Math.max(0, Number(costingInputs.ovenHours.value) || 0);
  const electricityCost = energyKwh * Math.max(0, Number(costingInputs.electricityRate.value) || 0);
  const batchCost = ingredientCost + electricityCost;
  const unitCost = batchCost / yieldCount;
  const profitUnit = salePrice - unitCost;
  const profitBatch = profitUnit * yieldCount;
  const margin = salePrice > 0 ? (profitUnit / salePrice) * 100 : 0;

  costingResults.ingredients.textContent = money(ingredientCost);
  costingResults.electricity.textContent = money(electricityCost);
  costingResults.batch.textContent = money(batchCost);
  costingResults.unit.textContent = money(unitCost);
  costingResults.profitUnit.textContent = money(profitUnit);
  costingResults.margin.textContent = `${margin.toFixed(1)}%`;
  costingResults.profitBatch.textContent = money(profitBatch);
  saveCostingDraft();
}

async function initCostingCalculator() {
  loadCostingDraft();
  await loadCostingDataFromServer();
  renderPriceBook();
  renderRecipeIngredients();
  renderSavedRecipes();
  calculateCosting();

  savedRecipeSelect.addEventListener("change", () => {
    const recipe = productRecipes.find((item) => item.id === savedRecipeSelect.value);
    if (recipe) loadRecipe(recipe);
  });

  newRecipeButton.addEventListener("click", resetRecipe);

  saveRecipeButton.addEventListener("click", () => {
    const name = productNameInput.value.trim();
    if (!name) {
      setFeedback(recipeSaveFeedback, "Please enter a product name first.", "error");
      productNameInput.focus();
      return;
    }
    const recipe = snapshotCurrentRecipe();
    const existingIndex = productRecipes.findIndex((item) => item.id === recipe.id);
    if (existingIndex === -1) {
      productRecipes.push(recipe);
    } else {
      productRecipes[existingIndex] = recipe;
    }
    currentRecipeId = recipe.id;
    saveCostingDraft();
    renderSavedRecipes();
    setFeedback(recipeSaveFeedback, `${name} saved. You can find it in Saved products.`, "success");
  });

  addPriceItemButton.addEventListener("click", () => {
    priceBook.push(emptyPriceItem());
    renderPriceBook();
    renderRecipeIngredients();
    calculateCosting();
  });

  addRecipeIngredientButton.addEventListener("click", () => {
    recipeIngredients.push(emptyRecipeIngredient());
    renderRecipeIngredients();
    calculateCosting();
  });

  priceBookRows.addEventListener("input", (event) => {
    const field = event.target.closest("[data-price-field]");
    const row = event.target.closest("[data-price-index]");
    if (!field || !row) return;
    const index = Number(row.dataset.priceIndex);
    const key = field.dataset.priceField;
    priceBook[index][key] = key === "name" ? field.value : Number(field.value) || 0;
    renderRecipeIngredients();
    calculateCosting();
  });

  priceBookRows.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-price]");
    if (!removeButton || priceBook.length === 1) return;
    const removedIndex = Number(removeButton.dataset.removePrice);
    priceBook.splice(removedIndex, 1);
    recipeIngredients = recipeIngredients
      .filter((item) => Number(item.materialId) !== removedIndex)
      .map((item) => ({
        ...item,
        materialId: Number(item.materialId) > removedIndex ? String(Number(item.materialId) - 1) : item.materialId,
      }));
    renderPriceBook();
    renderRecipeIngredients();
    calculateCosting();
  });

  recipeRows.addEventListener("input", handleRecipeChange);
  recipeRows.addEventListener("change", handleRecipeChange);
  recipeRows.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-recipe]");
    if (!removeButton || recipeIngredients.length === 1) return;
    recipeIngredients.splice(Number(removeButton.dataset.removeRecipe), 1);
    renderRecipeIngredients();
    calculateCosting();
  });

  Object.values(costingInputs).forEach((input) => input.addEventListener("input", calculateCosting));
}

function handleRecipeChange(event) {
  const field = event.target.closest("[data-recipe-field]");
  const row = event.target.closest("[data-recipe-index]");
  if (!field || !row) return;
  const index = Number(row.dataset.recipeIndex);
  const key = field.dataset.recipeField;
  recipeIngredients[index][key] = key === "materialId" ? field.value : Number(field.value) || 0;
  renderRecipeIngredients();
  calculateCosting();
}

function setFeedback(target, message, type = "success") {
  target.hidden = false;
  target.className = `form-feedback ${type}`;
  target.textContent = message;
}

function clearFeedback(target) {
  target.hidden = true;
  target.textContent = "";
}

function queueTranslation(form, sourceField, feedbackTarget, selectorAttribute) {
  const source = form.querySelector(`[${selectorAttribute}="${sourceField.dataset.translateSource}"]`);
  const target = form.querySelector(`[${selectorAttribute}="${sourceField.dataset.translateTarget}"]`);
  const text = source.value.trim();
  if (!text || !target) return;
  clearTimeout(translationTimers.get(sourceField.dataset.translateSource));
  const timer = setTimeout(async () => {
    setFeedback(feedbackTarget, "Translating to English...", "success");
    try {
      const response = await fetch("/api/translate-product-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, field: sourceField.dataset.translateSource }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to translate this field.");
      target.value = result.translated;
      setFeedback(feedbackTarget, "English text filled automatically. You can edit it.", "success");
    } catch (error) {
      setFeedback(feedbackTarget, error.message, "error");
    }
  }, 700);
  translationTimers.set(sourceField.dataset.translateSource, timer);
}

function queueProductTranslation(sourceField) {
  queueTranslation(productEditForm, sourceField, translationFeedback, "data-edit-field");
}

function queueNewProductTranslation(sourceField) {
  queueTranslation(productForm, sourceField, productFeedback, "name");
}

async function translateAllFields(form, feedbackTarget, targetSelector) {
  const fields = [...form.querySelectorAll("[data-translate-source]")].filter((field) => field.value.trim());
  if (!fields.length) {
    setFeedback(feedbackTarget, "Enter at least one Chinese field first.", "error");
    return;
  }

  setFeedback(feedbackTarget, "Translating all English fields...", "success");
  try {
    await Promise.all(
      fields.map(async (sourceField) => {
        const response = await fetch("/api/translate-product-field", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sourceField.value.trim(), field: sourceField.dataset.translateSource }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to translate this field.");
        const target = form.querySelector(`${targetSelector}="${sourceField.dataset.translateTarget}"`);
        if (target) target.value = result.translated;
      })
    );
    setFeedback(feedbackTarget, "All English fields have been filled. You can edit them before saving.", "success");
  } catch (error) {
    setFeedback(feedbackTarget, error.message, "error");
  }
}

const MAX_IMAGE_DIMENSION = 1600;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image format cannot be displayed. Please choose a JPG, PNG, or WebP image."));
    };
    image.src = objectUrl;
  });
}

async function fileToDataUrl(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("The image is too large. Please choose an image smaller than 12 MB.");
  }

  const image = await loadImageFile(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  // Normalizing uploads to JPEG avoids HEIC/large-original compatibility
  // problems and keeps the product API response reasonably small.
  return canvas.toDataURL("image/jpeg", 0.84);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderProducts() {
  if (!productState.length) {
    adminProducts.innerHTML = `<p class="muted-text">No products yet. Publish your first bake from the form.</p>`;
    return;
  }

  adminProducts.innerHTML = productState
    .map(
      (product) => `
        <article class="admin-product-card">
          <div class="admin-product-summary">
            <img class="admin-product-thumb" src="${product.image}" alt="${product.name}" />
            <div>
              <h3 class="product-title">${product.name}</h3>
              <p class="muted-text">${product.nameEn || "English name not set"}</p>
              <p class="muted-text">${product.category || "Limited Drop"} / EUR ${product.price} / ${
                product.active ? "Live" : "Hidden"
              }</p>
            </div>
            <span class="stock-pill ${product.stock === 0 ? "empty" : ""}">
              ${product.stock === 0 ? "Out of stock" : `${product.stock} left`}
            </span>
          </div>
          <p class="muted-text">Allergens: ${product.allergens?.length ? product.allergens.join(" / ") : "None listed"}</p>
          <div class="admin-product-actions">
            <button class="small-button admin-edit-button" type="button" data-edit-product="${product.id}">Edit product</button>
            <button class="small-button danger" type="button" data-delete-product="${product.id}">Delete product</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersList.innerHTML = `<p class="muted-text">No reservations yet.</p>`;
    return;
  }

  ordersList.innerHTML = orders
    .map(
      (order) => `
        <article class="order-item">
          <div class="order-head">
            <div>
              <h3 class="product-title">${order.productName}</h3>
              <p class="muted-text">${formatDate(order.createdAt)}</p>
            </div>
            <span class="tag">${order.quantity} reserved</span>
          </div>
          <p><strong>${order.customerName}</strong> / ${order.customerPhone}</p>
          <p class="muted-text">${order.note || "No notes"}</p>
        </article>
      `
    )
    .join("");
}

async function fetchProducts() {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Unable to load products.");
  }
  productState = await response.json();
  renderProducts();
}

async function fetchOrders() {
  const response = await fetch("/api/orders");
  if (!response.ok) {
    throw new Error("Unable to load reservations.");
  }
  const orders = await response.json();
  renderOrders(orders);
}

productForm.imageFile.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) {
    uploadedImageData = "";
    return;
  }

  try {
    uploadedImageData = await fileToDataUrl(file);
    setFeedback(productFeedback, "Image loaded. It will be saved with the product.", "success");
  } catch (error) {
    setFeedback(productFeedback, error.message, "error");
  }
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback(productFeedback);

  const formData = new FormData(productForm);
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const payload = {
    name: formData.get("name"),
    nameEn: formData.get("nameEn"),
    category: formData.get("category"),
    categoryEn: formData.get("categoryEn"),
    description: formData.get("description"),
    descriptionEn: formData.get("descriptionEn"),
    allergens: String(formData.get("allergens") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    allergensEn: String(formData.get("allergensEn") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    pickupWindow: formData.get("pickupWindow"),
    pickupWindowEn: formData.get("pickupWindowEn"),
    image: uploadedImageData || imageUrl,
    active: productForm.active.checked,
  };

  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to publish product.");
    }

    productForm.reset();
    uploadedImageData = "";
    setFeedback(productFeedback, `Published: ${result.name}`, "success");
    await Promise.all([fetchProducts(), fetchOrders()]);
  } catch (error) {
    setFeedback(productFeedback, error.message, "error");
  }
});

adminProducts.addEventListener("click", async (event) => {
  const updateButton = event.target.closest("[data-update-stock]");
  const updatePriceButton = event.target.closest("[data-update-price]");
  const editProductButton = event.target.closest("[data-edit-product]");
  const toggleButton = event.target.closest("[data-toggle-product]");
  const deleteButton = event.target.closest("[data-delete-product]");

  try {
    if (editProductButton) {
      const productId = editProductButton.dataset.editProduct;
      const product = productState.find((item) => item.id === productId);
      if (!product) return;
      editingProductId = productId;
      productEditTitle.textContent = product.name;
      const setValue = (field, value) => {
        productEditForm.querySelector(`[data-edit-field="${field}"]`).value = value ?? "";
      };
      setValue("name", product.name);
      setValue("nameEn", product.nameEn);
      setValue("category", product.category);
      setValue("categoryEn", product.categoryEn);
      setValue("description", product.description);
      setValue("descriptionEn", product.descriptionEn);
      setValue("allergens", (product.allergens || []).join(", "));
      setValue("allergensEn", (product.allergensEn || []).join(", "));
      setValue("pickupWindow", product.pickupWindow);
      setValue("pickupWindowEn", product.pickupWindowEn);
      setValue("price", product.price);
      setValue("stock", product.stock);
      setValue("image", product.image);
      uploadedEditImageData = "";
      editImageFile.value = "";
      clearFeedback(productEditFeedback);
      clearFeedback(translationFeedback);
      productEditDialog.showModal();
      return;
    }

    if (updateButton) {
      const productId = updateButton.dataset.updateStock;
      const input = document.querySelector(`[data-stock-input="${productId}"]`);
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Number(input.value) }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to update stock.");
      }
      await fetchProducts();
      return;
    }

    if (updatePriceButton) {
      const productId = updatePriceButton.dataset.updatePrice;
      const input = document.querySelector(`[data-price-input="${productId}"]`);
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(input.value) }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to update price.");
      }
      await fetchProducts();
      return;
    }

    if (toggleButton) {
      const productId = toggleButton.dataset.toggleProduct;
      const current = productState.find((item) => item.id === productId);
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !current.active }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to update product status.");
      }
      await fetchProducts();
      return;
    }

    if (deleteButton) {
      const productId = deleteButton.dataset.deleteProduct;
      const product = productState.find((item) => item.id === productId);
      if (!product || !window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to delete product.");
      }
      await Promise.all([fetchProducts(), fetchOrders()]);
    }
  } catch (error) {
    setFeedback(productFeedback, error.message, "error");
  }
});

document.querySelector("#close-product-edit").addEventListener("click", () => productEditDialog.close());

translateEditProductButton.addEventListener("click", () =>
  translateAllFields(productEditForm, translationFeedback, "[data-edit-field]")
);

translateNewProductButton.addEventListener("click", () =>
  translateAllFields(productForm, productFeedback, "[name]")
);

editImageFile.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    uploadedEditImageData = await fileToDataUrl(file);
    productEditForm.querySelector('[data-edit-field="image"]').value = "";
    setFeedback(productEditFeedback, "Local image selected. Save product details to upload it.", "success");
  } catch (error) {
    setFeedback(productEditFeedback, error.message, "error");
  }
});

productEditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const getValue = (field) => productEditForm.querySelector(`[data-edit-field="${field}"]`).value.trim();
  const splitValues = (field) => getValue(field).split(",").map((item) => item.trim()).filter(Boolean);
  try {
    const response = await fetch(`/api/products/${editingProductId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: getValue("name"),
        nameEn: getValue("nameEn"),
        category: getValue("category"),
        categoryEn: getValue("categoryEn"),
        description: getValue("description"),
        descriptionEn: getValue("descriptionEn"),
        allergens: splitValues("allergens"),
        allergensEn: splitValues("allergensEn"),
        pickupWindow: getValue("pickupWindow"),
        pickupWindowEn: getValue("pickupWindowEn"),
        price: Number(getValue("price")),
        stock: Number(getValue("stock")),
        image: uploadedEditImageData || getValue("image"),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to save product details.");
    productEditDialog.close();
    await fetchProducts();
    setFeedback(productFeedback, `${result.name} details saved.`, "success");
  } catch (error) {
    setFeedback(productEditFeedback, error.message, "error");
  }
});

async function initializeAdmin() {
  const sessionResponse = await fetch("/api/admin/session");
  const session = await sessionResponse.json();
  if (!session.authenticated) {
    adminLogin.hidden = false;
    adminMain.hidden = true;
    adminPasswordInput.focus();
    return;
  }

  adminLogin.hidden = true;
  adminMain.hidden = false;
  initCostingCalculator();
  Promise.all([fetchProducts(), fetchOrders()]).catch((error) => {
    setFeedback(productFeedback, error.message, "error");
  });
}

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminLoginFeedback.hidden = true;
  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPasswordInput.value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to sign in.");
    adminPasswordInput.value = "";
    await initializeAdmin();
  } catch (error) {
    adminLoginFeedback.hidden = false;
    adminLoginFeedback.className = "form-feedback error";
    adminLoginFeedback.textContent = error.message;
  }
});

adminLogoutButton.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.reload();
});

initializeAdmin().catch((error) => {
  adminLoginFeedback.hidden = false;
  adminLoginFeedback.className = "form-feedback error";
  adminLoginFeedback.textContent = error.message;
});
