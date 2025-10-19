# Products Admin API

Express + Mongoose REST API that backs both the customer storefront and the admin portal. Provides authentication, product catalogue, cart management, order lifecycle, optional chatbot integrations, and Cloudinary image uploads.

## Features
- Credential-based login for admins _and_ shoppers (with registration) backed by signed JWTs.
- MongoDB persistence for products with public catalogue endpoints (search/filter/sort) and protected admin CRUD operations.
- Server-side cart APIs so clients (and the chatbot) can sync cart activity alongside the checkout flow.
- Order creation + history APIs covering user checkout flows and admin reporting.
- Dedicated chatbot API surface to read cart/order data and trigger cart actions, backed by a separate API key.
- Cloudinary upload pipeline with file validation and 10-image limit.

## Setup

1. Install deps
   ```bash
   npm install
   ```
2. Configure env
   ```bash
   cp .env.example .env
   # fill in MongoDB URI, admin credentials, JWT secret, Cloudinary keys, etc.
   ```
3. Start the server
   ```bash
   npm run dev
   ```

The API listens on `PORT` (default `4000`). Health check available at `/health`.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/auth/login` | Validate credentials (admin or shopper) and return a JWT + user payload. |
| `POST` | `/auth/register` | Register a new shopper account and return a JWT. |
| `GET` | `/auth/me` | Retrieve the authenticated profile (admin or shopper). |
| `GET` | `/api/products` | Public product listing with `page`, `pageSize`, `search`, `category`, `sort`, `order`. |
| `POST` | `/api/products` | Create a product (requires admin JWT). |
| `GET` | `/api/products/:id` | Fetch a product by ID. |
| `PUT` | `/api/products/:id` | Update product metadata + images (admin). |
| `DELETE` | `/api/products/:id` | Delete a product (admin). |
| `GET` | `/api/cart` | Retrieve the authenticated shopper's cart. |
| `POST` | `/api/cart/items` | Add or increment a product in the shopper's cart. |
| `PATCH` | `/api/cart/items/:productId` | Update a cart item's quantity. |
| `DELETE` | `/api/cart/items/:productId` | Remove an item from the cart. |
| `DELETE` | `/api/cart` | Clear the cart. |
| `POST` | `/api/orders` | Create an order for the signed-in shopper (validates stock + emits chatbot event). |
| `GET` | `/api/orders/me` | Fetch the authenticated shopper's order history. |
| `GET` | `/api/orders` | Admin listing of all orders with pagination/filtering. |
| `GET` | `/api/orders/:id` | Admin order detail lookup. |
| `POST` | `/api/upload` | Upload up to 10 images (≤5 MB each) to Cloudinary (admin). |
| `GET` | `/chatbot/users/:userId/cart` | Chatbot-only endpoint to read a shopper's cart (requires chatbot API key). |
| `POST` | `/chatbot/users/:userId/cart/items` | Chatbot-only endpoint to add items to a shopper's cart. |
| `GET` | `/chatbot/users/:userId/orders` | Chatbot-only endpoint to read a shopper's orders. |
| `GET` | `/chatbot/orders/:orderId` | Chatbot-only endpoint to fetch a specific order. |

All protected routes require the `Authorization: Bearer <token>` header issued by `/auth/login`. Public catalogue reads (`GET /api/products` and `/api/products/:id`) do not require authentication.

## Scripts
- `npm run dev` – nodemon-powered development server.
- `npm run start` – run with Node.
- `npm run seed` – populate MongoDB with sample products from `scripts/product-seed-data.js`.

## Environment variables
See `.env.example` for the full list. The API requires either `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` (bcrypt hash) along with Cloudinary credentials.
