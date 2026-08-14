# Mochi Bakehouse Reservation Site

A small-batch bakery site for showcasing breads, bagels, cakes, and desserts.

## Features

- Storefront product photos, pricing, allergens, stock, and pickup windows
- Reservations without customer accounts; name and phone are required
- Password-protected admin area for products, orders, costing, and translation
- Product editing, publishing, stock updates, and permanent deletion
- Chinese/English storefront switcher; backend and operational messages are English
- JSON fallback storage with optional `MongoDB Atlas` configuration

## Storage modes

- Default: local JSON files
  - Products: `work/data/products.json`
  - Orders: `work/data/orders.json`
- MongoDB: set `MONGODB_URI` and `MONGODB_DB` to enable it
- If MongoDB is unavailable, the server falls back to JSON mode

## Configuration

Copy `.env.example` to `.env.local`, then set the values. `ADMIN_PASSWORD` controls the admin login password.

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.typfunz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=mochi_bakehouse
```

Use `GET /api/storage-mode` to check whether the app is running in `json` or `mongodb` mode.

## Run

```bash
node server.js
```

After starting:

- Storefront: `http://127.0.0.1:3000`
- Admin: `http://127.0.0.1:3000/admin.html`

部署到 Render 时，服务会自动使用 Render 提供的 `PORT`，并监听 `0.0.0.0`。
