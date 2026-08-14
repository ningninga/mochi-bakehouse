const productGrid = document.querySelector("#product-grid");
const statusBanner = document.querySelector("#status-banner");
const orderDialog = document.querySelector("#order-dialog");
const orderForm = document.querySelector("#order-form");
const closeDialogButton = document.querySelector("#close-dialog-button");
const orderProductName = document.querySelector("#order-product-name");
const orderHelper = document.querySelector("#order-helper");
const orderSuccessCode = document.querySelector("#order-success-code");
const orderFeedback = document.querySelector("#order-feedback");
const cancelForm = document.querySelector("#cancel-form");
const cancelFeedback = document.querySelector("#cancel-feedback");
const localeButtons = document.querySelectorAll("[data-locale-button]");

const translations = {
  zh: {
    pageTitle: "Mochi Bakehouse",
    brandEyebrow: "用爱烘焙",
    heroEyebrow: "小店介绍 · 手作烘焙 · 限量预约",
    heroTitleBefore: "一个由烘焙热爱撑起来的小小",
    heroTitleLove: "面包店",
    heroTitleAfter: "",
    heroText: "你好，我是一个热爱烘焙的人，也一直认真对待每一次揉面、发酵和出炉。Mochi Bakehouse 是我用心经营的小店，每一批面包都亲手准备。喜欢的话，可以看看这次出炉的款式，提前预约你的那一份。",
    heroPrimaryCta: "查看本次出炉",
    heroSecondaryCta: "了解预约方式",
    navAbout: "关于小店",
    navHow: "预约方式",
    navBakes: "本次出炉",
    navCancel: "取消预约",
    aboutEyebrow: "关于这家小店",
    aboutTitle: "从一个对烘焙上头的人，开始做一间小小的面包店",
    aboutText: "Mochi Bakehouse 是一个人的小厨房，也是我把对面包的热爱分享给大家的方式。每一批都慢慢准备、亲手完成，只在状态最好的时候开单。",
    aboutStat1Value: "小批量",
    aboutStat1Label: "手作烘焙",
    aboutStat2Value: "亲手做",
    aboutStat2Label: "认真对待每一批",
    aboutStat3Value: "Dublin 2",
    aboutStat3Label: "取货地点",
    introEyebrow: "预订方式",
    introTitle: "看看这次开放预约的面包，选好后直接留单",
    introStep1Title: "看看本次开单有什么",
    introStep1Text: "照片、口味、过敏原、价格和可预约数量都会写清楚。",
    introStep2Title: "选数量并留下联系方式",
    introStep2Text: "不用注册，填写姓名和手机号就能完成预约。",
    introStep3Title: "等我和你确认取货",
    introStep3Text: "提交后我会尽快联系你，确认时间和取货细节。",
    productsEyebrow: "可预约面包",
    productsTitle: "本次开放预约",
    productsNote: "每次开单数量都有限，约满即止。",
    cancelEyebrow: "取消预约",
    cancelTitle: "如果临时来不了，可以自己取消",
    cancelNote: "输入预约编号和下单手机号后，系统会自动释放数量。",
    cancelOrderIdLabel: "预约编号",
    cancelOrderIdPlaceholder: "例如 order-1786720683341",
    cancelPhoneLabel: "下单手机号",
    cancelPhonePlaceholder: "请输入下单时填写的手机号",
    cancelButton: "取消这笔预约",
    orderEyebrow: "预约面包",
    closeDialogAria: "关闭",
    orderNameLabel: "姓名",
    orderNamePlaceholder: "请输入姓名",
    orderPhoneLabel: "手机号",
    orderPhonePlaceholder: "请输入手机号",
    orderQuantityLabel: "预约数量",
    orderNoteLabel: "备注",
    orderNotePlaceholder: "例如少糖、晚一点来取",
    orderSubmit: "提交预约",
    orderSubmitting: "提交中…",
    orderSubmitted: "已提交",
    emptyEyebrow: "暂未开单",
    emptyTitle: "这次还没有开放预约的面包",
    emptyText: "这里会显示下一轮开放预约的面包，开单后会更新在这里。",
    noAllergen: "未填写过敏原",
    defaultCategory: "本次限定",
    soldOut: "本轮约满",
    availableUnits: (count) => `还可预约 ${count} 份`,
    defaultDescription: "开放预约后可直接留单，数量约满即止。",
    pickupWindow: (value) => `取货时间：${value}`,
    pickupFallback: "与你联系后确认",
    pickupLocation: "取货地点：Dublin 2",
    reserveButton: "预约",
    disabledReserveButton: "暂不可订",
    loadError: "加载商品失败",
    orderHelper: (stock) => `这次还可预约 ${stock} 份，取货地点：Dublin 2`,
    orderFailed: "预约失败",
    orderSuccessBanner: (name, remaining) => `已收到 ${name} 的预约，现在还可预约 ${remaining} 份。`,
    orderSuccessCode: (id) => `预约成功。你的预约编号是 ${id}，如果之后需要取消，请保留这个编号。`,
    orderSuccessFeedback: "预约已提交成功。关闭这个窗口前，可以先记下预约编号。",
    cancelFailed: "取消失败",
    cancelSuccessFeedback: "这笔预约已经取消，可预约数量也已自动恢复。",
    cancelSuccessBanner: "预约已取消。",
  },
  en: {
    pageTitle: "Mochi Bakehouse",
    brandEyebrow: "Baked with love",
    heroEyebrow: "About the shop / Handmade bakes / Limited reservations",
    heroTitleBefore: "A little bakehouse built on a whole lot of",
    heroTitleLove: "love",
    heroTitleAfter: "for baking.",
    heroText: "Hi, I'm a passionate home baker who takes every mix, proof, and bake seriously. Mochi Bakehouse is my small shop, made one careful batch at a time. Browse this release and reserve your favorites before they're gone.",
    heroPrimaryCta: "View This Release",
    heroSecondaryCta: "How Reservations Work",
    navAbout: "About",
    navHow: "How it works",
    navBakes: "Bakes",
    navCancel: "Cancel",
    aboutEyebrow: "About the bakehouse",
    aboutTitle: "It started with a love for baking and a little kitchen in Dublin 2.",
    aboutText: "Mochi Bakehouse is a one-person kitchen and my way of sharing the bakes I love. Every batch is prepared slowly, made by hand, and released when it is at its best.",
    aboutStat1Value: "Small batch",
    aboutStat1Label: "handmade bakes",
    aboutStat2Value: "Made by hand",
    aboutStat2Label: "with real care",
    aboutStat3Value: "Dublin 2",
    aboutStat3Label: "pickup only",
    introEyebrow: "How To Reserve",
    introTitle: "Browse this drop, choose what you want, and leave your reservation.",
    introStep1Title: "See what is available this round",
    introStep1Text: "Photos, flavors, allergens, pricing, and available quantities are all listed clearly.",
    introStep2Title: "Choose quantity and leave your details",
    introStep2Text: "No account is needed. Just enter your name and phone number to reserve.",
    introStep3Title: "Wait for pickup confirmation",
    introStep3Text: "I will follow up after your reservation to confirm timing and pickup details.",
    productsEyebrow: "Available To Reserve",
    productsTitle: "Open For This Drop",
    productsNote: "Each release has limited quantities and closes once fully reserved.",
    cancelEyebrow: "Cancel Reservation",
    cancelTitle: "If your plans change, you can cancel it here.",
    cancelNote: "Enter your reservation code and the phone number used when ordering to release the spot automatically.",
    cancelOrderIdLabel: "Reservation code",
    cancelOrderIdPlaceholder: "For example: order-1786720683341",
    cancelPhoneLabel: "Phone number",
    cancelPhonePlaceholder: "Use the same phone number from your order",
    cancelButton: "Cancel Reservation",
    orderEyebrow: "Reserve",
    closeDialogAria: "Close",
    orderNameLabel: "Name",
    orderNamePlaceholder: "Your name",
    orderPhoneLabel: "Phone number",
    orderPhonePlaceholder: "Your phone number",
    orderQuantityLabel: "Quantity",
    orderNoteLabel: "Notes",
    orderNotePlaceholder: "For example: less sweet, later pickup",
    orderSubmit: "Submit Reservation",
    orderSubmitting: "Submitting...",
    orderSubmitted: "Submitted",
    emptyEyebrow: "No Drop Live",
    emptyTitle: "There are no breads open for reservation right now.",
    emptyText: "The next release will appear here once reservations open again.",
    noAllergen: "No allergens listed",
    defaultCategory: "Limited Drop",
    soldOut: "Fully Reserved",
    availableUnits: (count) => `${count} left to reserve`,
    defaultDescription: "Reserve while this drop is open. Availability closes once it fills up.",
    pickupWindow: (value) => `Pickup window: ${value}`,
    pickupFallback: "To be confirmed with you",
    pickupLocation: "Pickup: Dublin 2",
    reserveButton: "Reserve",
    disabledReserveButton: "Unavailable",
    loadError: "Unable to load products",
    orderHelper: (stock) => `${stock} left to reserve. Pickup: Dublin 2.`,
    orderFailed: "Reservation failed",
    orderSuccessBanner: (name, remaining) => `Your reservation for ${name} is in. ${remaining} left to reserve.`,
    orderSuccessCode: (id) => `Reservation confirmed. Your reservation code is ${id}. Keep it if you need to cancel later.`,
    orderSuccessFeedback: "Your reservation has been submitted. Please save your reservation code before closing this window.",
    cancelFailed: "Cancellation failed",
    cancelSuccessFeedback: "This reservation has been cancelled and the quantity has been released.",
    cancelSuccessBanner: "Reservation cancelled.",
  },
};

let products = [];
let selectedProduct = null;
// English is the default for first-time visitors; keep any saved preference.
let currentLocale = localStorage.getItem("mochi-locale") || "en";
let isSubmittingOrder = false;
let orderSubmitted = false;
const orderSubmitButton = orderForm.querySelector('button[type="submit"]');

function localizeApiError(message, fallbackKey) {
  const errorMap = {
    "请输入姓名": currentLocale === "en" ? "Please enter your name." : "请填写姓名",
    "请填写有效手机号": currentLocale === "en" ? "Please enter a valid phone number." : "请填写有效手机号",
    "预约数量必须大于 0": currentLocale === "en" ? "Reservation quantity must be greater than 0." : "预约数量必须大于 0",
    "库存不足，请减少数量后再试": currentLocale === "en" ? "Not enough stock for this quantity." : "库存不足，请减少数量后再试",
    "商品不存在或已下架": currentLocale === "en" ? "This item is unavailable." : "商品不存在或已下架",
  };
  return errorMap[message] || message || t(fallbackKey);
}

function t(key) {
  return translations[currentLocale][key];
}

function localizedValue(product, zhKey, enKey, fallback = "") {
  if (currentLocale === "en" && product[enKey]) {
    return product[enKey];
  }
  return product[zhKey] || product[enKey] || fallback;
}

function showBanner(message, type = "success") {
  statusBanner.hidden = false;
  statusBanner.className = `status-banner ${type}`;
  statusBanner.textContent = message;
}

function hideBanner() {
  statusBanner.hidden = true;
  statusBanner.textContent = "";
}

function showOrderFeedback(message, type = "error") {
  orderFeedback.hidden = false;
  orderFeedback.className = `form-feedback ${type}`;
  orderFeedback.textContent = message;
}

function showCancelFeedback(message, type = "error") {
  cancelFeedback.hidden = false;
  cancelFeedback.className = `form-feedback ${type}`;
  cancelFeedback.textContent = message;
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLocale === "zh" ? "zh-CN" : "en";
  document.body.classList.toggle("locale-en", currentLocale === "en");
  document.title = t("pageTitle");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-label]").forEach((element) => {
    const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = `${t(element.dataset.i18nLabel)}\n            `;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  localeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.localeButton === currentLocale);
  });
}

function renderProducts() {
  const activeProducts = products.filter((item) => item.active);

  if (!activeProducts.length) {
    productGrid.innerHTML = `
      <article class="product-card">
        <div class="product-body">
          <p class="eyebrow">${t("emptyEyebrow")}</p>
          <h3 class="product-title">${t("emptyTitle")}</h3>
          <p class="product-description">${t("emptyText")}</p>
        </div>
      </article>
    `;
    return;
  }

  productGrid.innerHTML = activeProducts
    .map((product) => {
      const name = localizedValue(product, "name", "nameEn", "");
      const category = localizedValue(product, "category", "categoryEn", t("defaultCategory"));
      const description = localizedValue(product, "description", "descriptionEn", t("defaultDescription"));
      const allergensSource =
        currentLocale === "en" && Array.isArray(product.allergensEn) && product.allergensEn.length
          ? product.allergensEn
          : product.allergens;
      const allergens = allergensSource && allergensSource.length
        ? allergensSource.map((item) => `<span class="allergen-chip">${item}</span>`).join("")
        : `<span class="allergen-chip">${t("noAllergen")}</span>`;

      return `
        <article class="product-card">
          <img class="product-image" src="${product.image}" alt="${name}" />
          <div class="product-body">
            <div class="tag-row">
              <span class="tag">${category}</span>
              <span class="stock-pill ${product.stock === 0 ? "empty" : ""}">
                ${product.stock === 0 ? t("soldOut") : t("availableUnits")(product.stock)}
              </span>
            </div>

            <div class="product-head">
              <h3 class="product-title">${name}</h3>
              <div class="product-price">€${product.price}</div>
            </div>

            <p class="product-description">${description}</p>

            <div class="allergen-list">${allergens}</div>

            <div class="product-footer">
              <div class="meta-stack">
                <p class="product-meta">${t("pickupLocation")}</p>
              </div>
              <button class="button primary" type="button" data-order-id="${product.id}" ${
                product.stock === 0 ? "disabled" : ""
              }>
                ${product.stock === 0 ? t("disabledReserveButton") : t("reserveButton")}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(t("loadError"));
    }
    products = await response.json();
    renderProducts();
    if (selectedProduct) {
      selectedProduct = products.find((item) => item.id === selectedProduct.id) || null;
      if (selectedProduct && orderDialog.open) {
        syncOrderDialog();
      }
    }
  } catch (error) {
    showBanner(error.message, "error");
  }
}

function syncOrderDialog() {
  if (!selectedProduct) {
    return;
  }
  const name = localizedValue(selectedProduct, "name", "nameEn", "");
  orderProductName.textContent = name;
  orderHelper.textContent = t("orderHelper")(selectedProduct.stock);
}

function openOrderDialog(productId) {
  selectedProduct = products.find((item) => item.id === productId);
  if (!selectedProduct) {
    return;
  }

  orderForm.reset();
  isSubmittingOrder = false;
  orderSubmitted = false;
  orderSubmitButton.disabled = false;
  orderSubmitButton.textContent = t("orderSubmit");
  orderFeedback.hidden = true;
  orderSuccessCode.hidden = true;
  syncOrderDialog();
  orderForm.quantity.value = "1";
  orderForm.quantity.max = String(Math.max(1, selectedProduct.stock));
  orderDialog.showModal();
}

function closeOrderDialog() {
  orderDialog.close();
  selectedProduct = null;
}

function setLocale(locale) {
  currentLocale = locale;
  localStorage.setItem("mochi-locale", locale);
  applyStaticTranslations();
  renderProducts();
  hideBanner();
  if (selectedProduct && orderDialog.open) {
    syncOrderDialog();
  }
}

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-id]");
  if (!button) {
    return;
  }
  openOrderDialog(button.dataset.orderId);
});

closeDialogButton.addEventListener("click", closeOrderDialog);

localeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLocale(button.dataset.localeButton);
  });
});

orderDialog.addEventListener("click", (event) => {
  const box = orderForm.getBoundingClientRect();
  const clickedInside =
    event.clientX >= box.left &&
    event.clientX <= box.right &&
    event.clientY >= box.top &&
    event.clientY <= box.bottom;

  if (!clickedInside) {
    closeOrderDialog();
  }
});

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedProduct || isSubmittingOrder || orderSubmitted) {
    return;
  }

  isSubmittingOrder = true;
  orderSubmitButton.disabled = true;
  orderSubmitButton.textContent = t("orderSubmitting");

  const formData = new FormData(orderForm);
  const payload = {
    productId: selectedProduct.id,
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    quantity: Number(formData.get("quantity")),
    note: formData.get("note"),
  };

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(localizeApiError(result.error, "orderFailed"));
    }

    const productName = localizedValue(selectedProduct, "name", "nameEn", "");
    showBanner(t("orderSuccessBanner")(productName, result.remainingStock), "success");
    orderSuccessCode.hidden = false;
    orderSuccessCode.textContent = t("orderSuccessCode")(result.order.id);
    showOrderFeedback(t("orderSuccessFeedback"), "success");
    cancelForm.orderId.value = result.order.id;
    orderSubmitted = true;
    orderSubmitButton.textContent = t("orderSubmitted");
    await loadProducts();
  } catch (error) {
    showOrderFeedback(localizeApiError(error.message, "orderFailed"), "error");
    orderSubmitButton.disabled = false;
    orderSubmitButton.textContent = t("orderSubmit");
  } finally {
    isSubmittingOrder = false;
  }
});

cancelForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  cancelFeedback.hidden = true;

  const formData = new FormData(cancelForm);
  const orderId = String(formData.get("orderId") || "").trim();
  const customerPhone = String(formData.get("customerPhone") || "").trim();

  try {
    const response = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerPhone }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || t("cancelFailed"));
    }

    showCancelFeedback(t("cancelSuccessFeedback"), "success");
    showBanner(t("cancelSuccessBanner"), "success");
    cancelForm.reset();
    await loadProducts();
  } catch (error) {
    showCancelFeedback(error.message, "error");
  }
});

applyStaticTranslations();
loadProducts();
hideBanner();
