# Mochi Bakehouse 预约站

一个可用于限量预约的面包站点，适合展示面包、贝果、蛋糕或甜点。

## 功能

- 前台展示商品照片、价格、过敏原、库存与取货时间
- 用户无需登录即可预约，但下单时必须填写姓名和手机号
- 后台新增商品、上传图片、设置价格和库存
- 后台查看订单、上下架商品、更新库存
- 支持中英文切换
- 存储层支持 `JSON fallback`，也预留了 `MongoDB Atlas` 配置

## 存储模式

- 默认模式：本地 JSON 文件
  - 商品：`work/data/products.json`
  - 订单：`work/data/orders.json`
- MongoDB 模式：配置 `MONGODB_URI` 和 `MONGODB_DB` 后，服务会优先尝试连接 MongoDB
- 如果 MongoDB 运行时 bundle 未准备好或连接失败，服务会自动回退到 JSON 模式

## MongoDB 配置

复制一份 `.env.example` 为 `.env.local`，然后填写：

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.typfunz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=mochi_bakehouse
```

可用 `GET /api/storage-mode` 查看当前是否跑在 `json` 还是 `mongodb`。

## 运行

```bash
node server.js
```

启动后访问：

- 前台：`http://127.0.0.1:3000`
- 后台：`http://127.0.0.1:3000/admin.html`

部署到 Render 时，服务会自动使用 Render 提供的 `PORT`，并监听 `0.0.0.0`。
