# Lá & Hạt · shop-web

> **Tiếng Việt:** Giao diện cửa hàng trà và cà phê Lá & Hạt, viết bằng React và TypeScript. Khách xem sản phẩm, lọc theo danh mục và giá, đăng ký, thêm vào giỏ, đặt hàng rồi chuyển khoản bằng mã VietQR. Chủ shop có trang quản trị để xác nhận tiền về và cập nhật trạng thái đơn. Máy chủ là [shop-api](https://github.com/giangggvu/shop-api) (Java Spring Boot).

Storefront for Lá & Hạt, a small online tea and coffee shop. It is the front end for [shop-api](https://github.com/giangggvu/shop-api).

**Live demo:** _add your Vercel link here_ · **API:** https://shop-api-ncx0.onrender.com

> The API runs on a free instance that sleeps when idle. The first request after a while can take up to a minute; the site shows a notice while it wakes up.

## What it does

- **Catalogue:** filter by category and price range, search by name, sort by newest or price, paginate. Filters live in the URL, so a filtered view can be shared.
- **Account:** register and log in. The session (a signed token from shop-api) is kept until it expires and is dropped if the server rejects it.
- **Cart:** stored on the server, so it follows the shopper across devices. Quantities are capped by what is in stock.
- **Checkout:** shipping details with Vietnamese phone validation, then an order page with a VietQR code that fills in the amount and the transfer note for any banking app.
- **Orders:** history, details, and cancelling an unpaid order.
- **Admin:** list orders by status and move them along (paid, shipping, completed, cancelled), mirroring the rules the server enforces.

## Stack

React 19, TypeScript, React Router, Vite. No UI library: one stylesheet with a small set of design tokens. Fonts are Bricolage Grotesque and Be Vietnam Pro, self-hosted through Fontsource so the site makes no request to Google. GitHub Actions lints and builds every push.

## Design

The shop has no product photos, so every product is drawn as its packaging, straight from its name (`src/components/ProductArt.tsx`): coffee in a kraft pouch with a degassing valve, tea in a tin (lotus pink for lotus tea, turmeric for ginger), brewing tools in a box glazed Bát Tràng blue. The label shows the growing region and the weight. A new product gets packaging without anyone drawing it.

Around that, the interface stays quiet: a rice-paper green ground, jade for actions, a slide-in cart that opens when something is added, skeleton cards while loading, numbered steps through checkout, and a progress line for each order. Motion respects `prefers-reduced-motion`.

## Run locally

```bash
cp .env.example .env      # points to http://localhost:8080 by default
npm install
npm run dev               # http://localhost:5173
```

Start [shop-api](https://github.com/giangggvu/shop-api) first. Its default CORS setting already allows `http://localhost:5173`.

## Deploy on Vercel

1. Import this repository in Vercel. It detects Vite automatically.
2. Add the environment variable `VITE_API_URL` with the shop-api address, for example `https://shop-api-ncx0.onrender.com`.
3. Deploy, then add the Vercel address to shop-api's `CORS_ALLOWED_ORIGINS` (comma-separated, no trailing slash).

`vercel.json` sends every path to `index.html`, so links such as `/orders/LH…` work when opened directly.

## Project layout

```
src/
├── api/        fetch wrapper, error handling, response types
├── auth/       session context (login, register, logout)
├── cart/       server-backed cart context
├── components/ layout and small shared pieces
├── lib/        price, date and status formatting
└── pages/      one file per screen
```

## License

MIT
