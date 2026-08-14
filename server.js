const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL, pathToFileURL } = require("url");

loadEnvFile(path.join(__dirname, ".env"));
loadEnvFile(path.join(__dirname, ".env.local"));

// Render requires the server to listen on all interfaces. Keep HOST
// configurable so local development can still override it if needed.
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "work", "data");
const vendorDir = path.join(__dirname, "work", "vendor");
const productsFile = path.join(dataDir, "products.json");
const ordersFile = path.join(dataDir, "orders.json");
const mongoBundlePath = process.env.MONGODB_BUNDLE_PATH || path.join(vendorDir, "mongodb.bundle.mjs");
const mongoDbName = process.env.MONGODB_DB || "mochi_bakehouse";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const seedProducts = [
  {
    id: "bread-sourdough-milk",
    name: "海盐黄油酸种",
    nameEn: "Sea Salt Butter Sourdough",
    description: "外脆内软，带一点发酵香气，适合早餐或做三明治。",
    descriptionEn: "Crusty outside, soft inside, with a gentle fermented aroma. Great for breakfast or sandwiches.",
    allergens: ["小麦", "奶制品"],
    allergensEn: ["Wheat", "Dairy"],
    price: 36,
    stock: 7,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    category: "欧包",
    categoryEn: "Sourdough",
    pickupWindow: "明天下午 4:00 - 7:00",
    pickupWindowEn: "Tomorrow, 4:00 PM - 7:00 PM",
    active: true,
    createdAt: "2026-08-14T11:26:58.973Z",
    updatedAt: "2026-08-14T15:26:39.583Z",
  },
  {
    id: "bread-brioche-choco",
    name: "可可布里欧修",
    nameEn: "Cocoa Brioche",
    description: "松软奶香中带可可层次，适合喜欢偏甜口感的客人。",
    descriptionEn: "Soft and buttery with cocoa notes, ideal for anyone who enjoys a slightly sweeter bake.",
    allergens: ["小麦", "鸡蛋", "奶制品"],
    allergensEn: ["Wheat", "Egg", "Dairy"],
    price: 28,
    stock: 12,
    image:
      "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80",
    category: "甜面包",
    categoryEn: "Sweet Bread",
    pickupWindow: "周六上午 10:00 - 12:00",
    pickupWindowEn: "Saturday, 10:00 AM - 12:00 PM",
    active: true,
    createdAt: "2026-08-14T11:26:58.981Z",
  },
  {
    id: "bread-bagel-sesame",
    name: "芝麻贝果",
    nameEn: "Sesame Bagel",
    description: "嚼劲足，冷冻也方便，回烤后依旧香。",
    descriptionEn: "Chewy and freezer-friendly, and still lovely after reheating.",
    allergens: ["小麦", "芝麻"],
    allergensEn: ["Wheat", "Sesame"],
    price: 18,
    stock: 16,
    image:
      "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=1200&q=80",
    category: "贝果",
    categoryEn: "Bagel",
    pickupWindow: "周六下午 2:00 - 6:00",
    pickupWindowEn: "Saturday, 2:00 PM - 6:00 PM",
    active: true,
    createdAt: "2026-08-14T11:26:58.981Z",
  },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function sanitizeDocument(doc) {
  if (!doc || typeof doc !== "object") {
    return doc;
  }
  const cloned = { ...doc };
  delete cloned._id;
  return cloned;
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 5 * 1024 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sanitizeProductPayload(payload, { partial = false } = {}) {
  const product = {};

  if (!partial || payload.name !== undefined) {
    if (typeof payload.name !== "string" || !payload.name.trim()) {
      throw new Error("请输入面包名称");
    }
    product.name = payload.name.trim();
  }

  if (!partial || payload.description !== undefined) {
    product.description = String(payload.description || "").trim();
  }

  if (!partial || payload.nameEn !== undefined) {
    product.nameEn = String(payload.nameEn || "").trim();
  }

  if (!partial || payload.descriptionEn !== undefined) {
    product.descriptionEn = String(payload.descriptionEn || "").trim();
  }

  if (!partial || payload.category !== undefined) {
    product.category = String(payload.category || "当日限定").trim() || "当日限定";
  }

  if (!partial || payload.categoryEn !== undefined) {
    product.categoryEn = String(payload.categoryEn || "").trim();
  }

  if (!partial || payload.pickupWindow !== undefined) {
    product.pickupWindow = String(payload.pickupWindow || "").trim();
  }

  if (!partial || payload.pickupWindowEn !== undefined) {
    product.pickupWindowEn = String(payload.pickupWindowEn || "").trim();
  }

  if (!partial || payload.image !== undefined) {
    const image = String(payload.image || "").trim();
    if (!image) {
      throw new Error("请上传或填写面包图片");
    }
    product.image = image;
  }

  if (!partial || payload.allergens !== undefined) {
    const allergens = Array.isArray(payload.allergens) ? payload.allergens : [];
    product.allergens = allergens.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (!partial || payload.allergensEn !== undefined) {
    const allergensEn = Array.isArray(payload.allergensEn) ? payload.allergensEn : [];
    product.allergensEn = allergensEn.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (!partial || payload.price !== undefined) {
    const price = Number(payload.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("请输入正确价格");
    }
    product.price = Number(price.toFixed(2));
  }

  if (!partial || payload.stock !== undefined) {
    const stock = Number(payload.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("请输入正确库存");
    }
    product.stock = stock;
  }

  if (!partial || payload.active !== undefined) {
    product.active = Boolean(payload.active);
  }

  return product;
}

function serveStaticFile(reqPath, res) {
  const requested = reqPath === "/" ? "/index.html" : reqPath;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, normalized);

  if (!filePath.startsWith(publicDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendText(res, 404, "Not Found");
        return;
      }
      sendText(res, 500, "Internal Server Error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    });
    res.end(content);
  });
}

function createJsonStorage() {
  return {
    mode: "json",
    async init() {
      fs.mkdirSync(dataDir, { recursive: true });
      if (!fs.existsSync(productsFile)) {
        writeJson(productsFile, seedProducts);
      }
      if (!fs.existsSync(ordersFile)) {
        writeJson(ordersFile, []);
      }
    },
    async getProducts() {
      return readJson(productsFile);
    },
    async createProduct(product) {
      const products = readJson(productsFile);
      const newProduct = { id: `bread-${Date.now()}`, createdAt: new Date().toISOString(), ...product };
      products.unshift(newProduct);
      writeJson(productsFile, products);
      return newProduct;
    },
    async updateProduct(productId, patch) {
      const products = readJson(productsFile);
      const index = products.findIndex((item) => item.id === productId);
      if (index === -1) {
        return null;
      }
      const updated = { ...products[index], ...patch, updatedAt: new Date().toISOString() };
      products[index] = updated;
      writeJson(productsFile, products);
      return updated;
    },
    async deleteProduct(productId) {
      const products = readJson(productsFile);
      const index = products.findIndex((item) => item.id === productId);
      if (index === -1) {
        return null;
      }
      const [removed] = products.splice(index, 1);
      writeJson(productsFile, products);
      return removed;
    },
    async listOrdersWithProductNames() {
      const orders = readJson(ordersFile);
      const products = readJson(productsFile);
      const productMap = new Map(products.map((item) => [item.id, item]));
      return orders.map((order) => ({
        ...order,
        productName: productMap.get(order.productId)?.name || "已删除商品",
      }));
    },
    async createOrder(orderInput) {
      const orders = readJson(ordersFile);
      const products = readJson(productsFile);
      const productIndex = products.findIndex((item) => item.id === orderInput.productId && item.active);
      if (productIndex === -1) {
        throw new Error("商品不存在或已下架");
      }

      const product = products[productIndex];
      if (product.stock < orderInput.quantity) {
        throw new Error("库存不足，请减少数量后再试");
      }

      products[productIndex] = {
        ...product,
        stock: product.stock - orderInput.quantity,
        updatedAt: new Date().toISOString(),
      };

      const newOrder = {
        id: `order-${Date.now()}`,
        productId: orderInput.productId,
        quantity: orderInput.quantity,
        customerName: orderInput.customerName,
        customerPhone: orderInput.customerPhone,
        note: orderInput.note,
        createdAt: new Date().toISOString(),
      };

      orders.unshift(newOrder);
      writeJson(productsFile, products);
      writeJson(ordersFile, orders);
      return { order: newOrder, remainingStock: products[productIndex].stock };
    },
    async cancelOrder(orderId, customerPhone) {
      const orders = readJson(ordersFile);
      const orderIndex = orders.findIndex((item) => item.id === orderId);
      if (orderIndex === -1) {
        throw new Error("未找到这笔预约");
      }

      const order = orders[orderIndex];
      if (order.customerPhone !== customerPhone) {
        throw new Error("手机号与预约信息不一致");
      }

      const products = readJson(productsFile);
      const productIndex = products.findIndex((item) => item.id === order.productId);
      if (productIndex !== -1) {
        products[productIndex] = {
          ...products[productIndex],
          stock: products[productIndex].stock + order.quantity,
          updatedAt: new Date().toISOString(),
        };
        writeJson(productsFile, products);
      }

      const [removedOrder] = orders.splice(orderIndex, 1);
      writeJson(ordersFile, orders);
      return removedOrder;
    },
  };
}

async function createMongoStorage() {
  let MongoClient;

  try {
    ({ MongoClient } = require("mongodb"));
  } catch (packageError) {
    const bundleUrl = pathToFileURL(mongoBundlePath).href;
    ({ MongoClient } = await import(bundleUrl));
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  return {
    mode: "mongodb",
    async init() {
      await client.connect();
      this.db = client.db(mongoDbName);
      this.products = this.db.collection("products");
      this.orders = this.db.collection("orders");
      await this.products.createIndex({ id: 1 }, { unique: true });
      await this.orders.createIndex({ id: 1 }, { unique: true });

      const productCount = await this.products.countDocuments();
      if (productCount === 0) {
        const localProducts = fs.existsSync(productsFile) ? readJson(productsFile) : seedProducts;
        await this.products.insertMany(localProducts.length ? localProducts : seedProducts);
      }

      const orderCount = await this.orders.countDocuments();
      if (orderCount === 0 && fs.existsSync(ordersFile)) {
        const localOrders = readJson(ordersFile);
        if (localOrders.length) {
          await this.orders.insertMany(localOrders);
        }
      }
    },
    async getProducts() {
      const docs = await this.products.find({}).sort({ createdAt: -1 }).toArray();
      return docs.map(sanitizeDocument);
    },
    async createProduct(product) {
      const newProduct = { id: `bread-${Date.now()}`, createdAt: new Date().toISOString(), ...product };
      await this.products.insertOne(newProduct);
      return newProduct;
    },
    async updateProduct(productId, patch) {
      const updated = { ...patch, updatedAt: new Date().toISOString() };
      const result = await this.products.findOneAndUpdate(
        { id: productId },
        { $set: updated },
        { returnDocument: "after" }
      );
      return result ? sanitizeDocument(result) : null;
    },
    async deleteProduct(productId) {
      const doc = await this.products.findOneAndDelete({ id: productId });
      return doc ? sanitizeDocument(doc) : null;
    },
    async listOrdersWithProductNames() {
      const orders = await this.orders.find({}).sort({ createdAt: -1 }).toArray();
      const productIds = [...new Set(orders.map((item) => item.productId))];
      const products = await this.products.find({ id: { $in: productIds } }).toArray();
      const productMap = new Map(products.map((item) => [item.id, item]));
      return orders.map((order) => ({
        ...sanitizeDocument(order),
        productName: productMap.get(order.productId)?.name || "已删除商品",
      }));
    },
    async createOrder(orderInput) {
      const product = await this.products.findOne({ id: orderInput.productId, active: true });
      if (!product) {
        throw new Error("商品不存在或已下架");
      }
      if (product.stock < orderInput.quantity) {
        throw new Error("库存不足，请减少数量后再试");
      }

      const updatedProduct = await this.products.findOneAndUpdate(
        { id: orderInput.productId, stock: { $gte: orderInput.quantity } },
        { $inc: { stock: -orderInput.quantity }, $set: { updatedAt: new Date().toISOString() } },
        { returnDocument: "after" }
      );

      if (!updatedProduct) {
        throw new Error("库存不足，请减少数量后再试");
      }

      const newOrder = {
        id: `order-${Date.now()}`,
        productId: orderInput.productId,
        quantity: orderInput.quantity,
        customerName: orderInput.customerName,
        customerPhone: orderInput.customerPhone,
        note: orderInput.note,
        createdAt: new Date().toISOString(),
      };

      await this.orders.insertOne(newOrder);
      return { order: newOrder, remainingStock: updatedProduct.stock };
    },
    async cancelOrder(orderId, customerPhone) {
      const order = await this.orders.findOne({ id: orderId });
      if (!order) {
        throw new Error("未找到这笔预约");
      }
      if (order.customerPhone !== customerPhone) {
        throw new Error("手机号与预约信息不一致");
      }

      await this.products.updateOne(
        { id: order.productId },
        { $inc: { stock: order.quantity }, $set: { updatedAt: new Date().toISOString() } }
      );
      await this.orders.deleteOne({ id: orderId });
      return sanitizeDocument(order);
    },
  };
}

async function initializeStorage() {
  const jsonStorage = createJsonStorage();
  await jsonStorage.init();

  if (!process.env.MONGODB_URI) {
    console.log("Storage mode: JSON fallback (MONGODB_URI not configured)");
    return jsonStorage;
  }

  const hasMongoPackage = fs.existsSync(path.join(__dirname, "node_modules", "mongodb"));
  if (!hasMongoPackage && !fs.existsSync(mongoBundlePath)) {
    console.log(`Storage mode: JSON fallback (Mongo runtime missing; install package or provide bundle at ${mongoBundlePath})`);
    return jsonStorage;
  }

  try {
    const mongoStorage = await createMongoStorage();
    await mongoStorage.init();
    console.log(`Storage mode: MongoDB (${mongoDbName})`);
    return mongoStorage;
  } catch (error) {
    console.error(`MongoDB init failed, falling back to JSON: ${error.message}`);
    return jsonStorage;
  }
}

function validateOrderPayload(payload) {
  const cleanName = String(payload.customerName || "").trim();
  const cleanPhone = String(payload.customerPhone || "").trim();
  const cleanNote = String(payload.note || "").trim();
  const requestedQty = Number(payload.quantity);

  if (!cleanName) {
    throw new Error("请填写姓名");
  }
  if (!/^[0-9+\-\s]{6,20}$/.test(cleanPhone)) {
    throw new Error("请填写有效手机号");
  }
  if (!Number.isInteger(requestedQty) || requestedQty <= 0) {
    throw new Error("预约数量必须大于 0");
  }

  return {
    productId: String(payload.productId || "").trim(),
    quantity: requestedQty,
    customerName: cleanName,
    customerPhone: cleanPhone,
    note: cleanNote,
  };
}

function validateCancelPhone(payload) {
  const customerPhone = String(payload.customerPhone || "").trim();
  if (!/^[0-9+\-\s]{6,20}$/.test(customerPhone)) {
    throw new Error("请填写下单时使用的手机号");
  }
  return customerPhone;
}

function createRequestHandler(storage) {
  return async function requestHandler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    try {
      if (url.pathname === "/api/products") {
        if (req.method === "GET") {
          sendJson(res, 200, await storage.getProducts());
          return;
        }

        if (req.method === "POST") {
          const payload = await parseBody(req);
          const clean = sanitizeProductPayload(payload);
          const created = await storage.createProduct(clean);
          sendJson(res, 201, created);
          return;
        }

        sendText(res, 405, "Method Not Allowed");
        return;
      }

      if (url.pathname.startsWith("/api/products/")) {
        const productId = url.pathname.split("/").pop();

        if (req.method === "PATCH") {
          const payload = await parseBody(req);
          const clean = sanitizeProductPayload(payload, { partial: true });
          const updated = await storage.updateProduct(productId, clean);
          if (!updated) {
            sendJson(res, 404, { error: "未找到这个面包" });
            return;
          }
          sendJson(res, 200, updated);
          return;
        }

        if (req.method === "DELETE") {
          const removed = await storage.deleteProduct(productId);
          if (!removed) {
            sendJson(res, 404, { error: "未找到这个面包" });
            return;
          }
          sendJson(res, 200, removed);
          return;
        }

        sendText(res, 405, "Method Not Allowed");
        return;
      }

      if (url.pathname === "/api/orders") {
        if (req.method === "GET") {
          sendJson(res, 200, await storage.listOrdersWithProductNames());
          return;
        }

        if (req.method === "POST") {
          const payload = await parseBody(req);
          const orderInput = validateOrderPayload(payload);
          const result = await storage.createOrder(orderInput);
          sendJson(res, 201, { success: true, ...result });
          return;
        }

        sendText(res, 405, "Method Not Allowed");
        return;
      }

      if (url.pathname.startsWith("/api/orders/") && url.pathname.endsWith("/cancel")) {
        if (req.method !== "POST") {
          sendText(res, 405, "Method Not Allowed");
          return;
        }
        const orderId = url.pathname.split("/")[3];
        const payload = await parseBody(req);
        const customerPhone = validateCancelPhone(payload);
        const cancelledOrder = await storage.cancelOrder(orderId, customerPhone);
        sendJson(res, 200, { success: true, cancelledOrder });
        return;
      }

      if (url.pathname === "/api/storage-mode") {
        sendJson(res, 200, {
          mode: storage.mode,
          mongoConfigured: Boolean(process.env.MONGODB_URI),
          mongoBundleReady: fs.existsSync(mongoBundlePath),
          databaseName: mongoDbName,
        });
        return;
      }

      serveStaticFile(url.pathname, res);
    } catch (error) {
      const statusCode =
        error.message.includes("未找到") ||
        error.message.includes("不存在") ||
        error.message.includes("已下架")
          ? 404
          : 400;
      sendJson(res, statusCode, { error: error.message || "服务器错误" });
    }
  };
}

async function start() {
  const storage = await initializeStorage();
  const server = http.createServer(createRequestHandler(storage));
  server.listen(port, host, () => {
    console.log(`Bakery app running at http://${host}:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
