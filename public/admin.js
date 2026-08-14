const productForm = document.querySelector("#product-form");
const productFeedback = document.querySelector("#product-feedback");
const adminProducts = document.querySelector("#admin-products");
const ordersList = document.querySelector("#orders-list");

let productState = [];
let uploadedImageData = "";

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
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderProducts() {
  if (!productState.length) {
    adminProducts.innerHTML = `<p class="muted-text">还没有商品，先在左侧发布第一款面包吧。</p>`;
    return;
  }

  adminProducts.innerHTML = productState
    .map(
      (product) => `
        <article class="admin-product-card">
          <div class="admin-product-head">
            <div>
              <h3 class="product-title">${product.name}</h3>
              <p class="muted-text">${product.category || "当日限定"} · €${product.price} · ${
                product.active ? "上架中" : "已下架"
              }</p>
            </div>
            <span class="stock-pill ${product.stock === 0 ? "empty" : ""}">
              ${product.stock === 0 ? "无库存" : `剩余 ${product.stock} 份`}
            </span>
          </div>

          <p class="muted-text">过敏原：${product.allergens.length ? product.allergens.join(" / ") : "未填写"}</p>
          <div class="admin-product-controls">
            <input type="number" min="0" value="${product.stock}" data-stock-input="${product.id}" />
            <button class="small-button" type="button" data-update-stock="${product.id}">更新库存</button>
            <button class="small-button ghost" type="button" data-toggle-product="${product.id}">
              ${product.active ? "下架" : "上架"}
            </button>
            <button class="small-button danger" type="button" data-delete-product="${product.id}">删除</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersList.innerHTML = `<p class="muted-text">还没有客户预约。</p>`;
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
            <span class="tag">预约 ${order.quantity} 份</span>
          </div>
          <p><strong>${order.customerName}</strong> · ${order.customerPhone}</p>
          <p class="muted-text">${order.note || "无备注"}</p>
        </article>
      `
    )
    .join("");
}

async function fetchProducts() {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("加载商品失败");
  }
  productState = await response.json();
  renderProducts();
}

async function fetchOrders() {
  const response = await fetch("/api/orders");
  if (!response.ok) {
    throw new Error("加载预约失败");
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
      throw new Error(result.error || "发布失败");
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
        throw new Error(result.error || "更新库存失败");
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
        throw new Error(result.error || "更新状态失败");
      }
      await fetchProducts();
      return;
    }

    if (deleteButton) {
      const productId = deleteButton.dataset.deleteProduct;
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "删除失败");
      }
      await Promise.all([fetchProducts(), fetchOrders()]);
    }
  } catch (error) {
    setFeedback(productFeedback, error.message, "error");
  }
});

Promise.all([fetchProducts(), fetchOrders()]).catch((error) => {
  setFeedback(productFeedback, error.message, "error");
});
