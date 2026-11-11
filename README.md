# taojie-overseas-admin

淘街海外商城的**独立管理后台**（前后端分离）：Vue 3 + Element Plus，
界面与模块划分参照 `OrderDe/plat` 平台后台。后端只提供接口
（`taojie-overseas-server`，Node 版或 Java 版二选一，接口契约一致）。

## 功能

- **账号登录**：用户名 + 密码，登录后按角色显示菜单；
- **菜单权限**：商品 `products` / 分类 `categories` / 询价 `rfq` /
  站点配置 `config` / 用户与角色 `users`，超级管理员为 `*`（全部）；
  接口侧同样强制校验（无权返回 403）；
- **商品管理**：五语名称、分类、**品牌**、美元价/原价、MOQ、单位、销量、
  标签、简介、规格行、商品图（上传或填 URL）、上下架、排序；
- **分类管理** / **品牌管理**：增删改查（照 plat 的品牌模块：多语名称 +
  Logo；分类/品牌下有商品时后端拒绝删除）；
- **询价列表**：前台 RFQ 留资；
- **站点配置**：主题/语言/标题/公告/WhatsApp/邮箱/币种/询价开关；
- **用户与角色**：账号增删改、启用禁用、重置密码；角色 = 菜单权限集合
  （预置 超级管理员 / 运营 / 外贸员；最后一个超级管理员受保护）。

首次使用：后端用户表为空时自动生成初始账号 **admin**，密码 = 后端
环境变量 `ADMIN_TOKEN` 的值；登录后请到「用户与角色」里改密码、加人。

## 本地运行

```bash
npm install
npm run dev    # http://localhost:5181 ，/api 与 /uploads 已代理到后端 3100
```

先把后端跑起来（另一个终端）：

```bash
cd ../taojie-overseas-server
ADMIN_TOKEN=你的令牌 npm start   # http://localhost:3100
```

## 构建与部署

```bash
npm run build   # 产物在 dist/
```

生产部署（雅加达服务器，Nginx）：

- `dist/` 静态文件挂到后台域名（如 `admin.你的域名`）；
- `/api/` 与 `/uploads/` 反向代理到后端 3100 端口；
- 若后台与后端不同源，把 `.env.example` 里的 `VITE_API_BASE`
  设为后端地址后重新构建。
