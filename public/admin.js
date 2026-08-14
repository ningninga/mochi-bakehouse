const productForm = document.querySelector("#product-form");
const productFeedback = document.querySelector("#product-feedback");
const adminProducts = document.querySelector("#admin-products");
const ordersList = document.querySelector("#orders-list");
const ingredientRows = document.querySelector("#ingredient-rows");
const addIngredientButton = document.querySelector("#add-ingredient");
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
let ingredients = [];

function money(value) {
  return `€${value.toFixed(2)}`;
}

function emptyIngredient() {
  return { name: "", amount: 0, packSize: 1000, packPrice: 0 };
}

function loadCostingDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(costingStorageKey) || "null");
    if (saved?.ingredients?.length) {
      ingredients = saved.ingredients;
    } else {
      ingredients = [emptyIngredient()];
    }
    Object.entries(costingInputs).forEach(([key, input]) => {
      if (saved?.[key] !== undefined) {
        input.value = saved[key];
      }
    });
  } catch {
    ingredients = [emptyIngredient()];
  }
}

function saveCostingDraft() {
  const draft = {
    ingredients,
    ...Object.fromEntries(Object.entries(costingInputs).map(([key, input]) => [key, input.value])),
  };
  localStorage.setItem(costingStorageKey, JSON.stringify(draft));
}

function renderIngredients() {
  ingredientRows.innerHTML = ingredients
    .map(
      (ingredient, index) => `
        <div class="ingredient-row" data-ingredient-index="${index}">
          <label>
            Ingredient
            <input data-ingredient-field="name" type="text" value="${ingredient.name}" placeholder="e.g. Flour" />
          </label>
          <label>
            Used (g)
            <input data-ingredient-field="amount" type="number" min="0" step="0.1" value="${ingredient.amount}" />
          </label>
          <label>
            Pack size (g)
            <input data-ingredient-field="packSize" type="number" min="0" step="1" value="${ingredient.packSize}" />
          </label>
          <label>
            Pack price (EUR)
            <input data-ingredient-field="packPrice" type="number" min="0" step="0.01" value="${ingredient.packPrice}" />
          </label>
          <button class="ingredient-remove" type="button" data-remove-ingredient="${index}" aria-label="Remove ingredient">×</button>
        </div>
      `
    )
    .join("");
}

function calculateCosting() {
  const ingredientCost = ingredients.reduce((total, ingredient) => {
    const amount = Number(ingredient.amount) || 0;
    const packSize = Number(ingredient.packSize) || 0;
    const packPrice = Number(ingredient.packPrice) || 0;
    return total + (packSize > 0 ? (amount / packSize) * packPrice : 0);
  }, 0);
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

function initCostingCalculator() {
  loadCostingDraft();
  renderIngredients();
  calculateCosting();

  addIngredientButton.addEventListener("click", () => {
    ingredients.push(emptyIngredient());
    renderIngredients();
    calculateCosting();
  });

  ingredientRows.addEventListener("input", (event) => {
    const field = event.target.closest("[data-ingredient-field]");
    const row = event.target.closest("[data-ingredient-index]");
    if (!field || !row) return;
    const index = Number(row.dataset.ingredientIndex);
    const key = field.dataset.ingredientField;
    ingredients[index][key] = key === "name" ? field.value : Number(field.value) || 0;
    calculateCosting();
  });

  ingredientRows.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-ingredient]");
    if (!removeButton || ingredients.length === 1) return;
    ingredients.splice(Number(removeButton.dataset.removeIngredient), 1);
    renderIngredients();
    calculateCosting();
  });

  Object.values(costingInputs).forEach((input) => input.addEventListener("input", calculateCosting));
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

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the image."));
    reader.readAsDataURL(file);
  });
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
          <div class="admin-product-head">
            <div>
              <h3 class="product-title">${product.name}</h3>
              <p class="muted-text">${product.category || "当日限定"} / EUR ${product.price} / ${
                product.active ? "Live" : "Hidden"
              }</p>
            </div>
            <span class="stock-pill ${product.stock === 0 ? "empty" : ""}">
              ${product.stock === 0 ? "Out of stock" : `${product.stock} left`}
            </span>
          </div>

          <p class="muted-text">Allergens: ${product.allergens.length ? product.allergens.join(" / ") : "None listed"}</p>
          <div class="admin-product-controls">
            <input type="number" min="0" value="${product.stock}" data-stock-input="${product.id}" />
            <button class="small-button" type="button" data-update-stock="${product.id}">Update stock</button>
            <button class="small-button ghost" type="button" data-toggle-product="${product.id}">
              ${product.active ? "Hide" : "Publish"}
            </button>
            <button class="small-button danger" type="button" data-delete-product="${product.id}">Delete</button>
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
    setFeedback(productFeedback, "图片已读取，提交商品时会一起保存。", "success");
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
    setFeedback(productFeedback, `已发布：${result.name}`, "success");
    await Promise.all([fetchProducts(), fetchOrders()]);
  } catch (error) {
    setFeedback(productFeedback, error.message, "error");
  }
});

adminProducts.addEventListener("click", async (event) => {
  const updateButton = event.target.closest("[data-update-stock]");
  const toggleButton = event.target.closest("[data-toggle-product]");
  const deleteButton = event.target.closest("[data-delete-product]");

  try {
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

initCostingCalculator();

Promise.all([fetchProducts(), fetchOrders()]).catch((error) => {
  setFeedback(productFeedback, error.message, "error");
});
